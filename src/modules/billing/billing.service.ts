import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BillingCustomer,
  BillingInvoice,
  BillingPlan,
  BillingSubscription,
  BillingSubscriptionItem,
  BillingWebhookEvent,
} from '../../entities';
import { BillingPlanSummary, BillingEntitlements, BillingSubscriptionStatus } from './types/billing.types';
import {
  DEFAULT_VENDOR_PLANS,
  PRODUCTS_PER_STORE_BY_PLAN,
  VISIBLE_VENDOR_PLAN_KEYS,
  VendorPlanKey,
} from './constants/vendor-plans';
import Stripe from 'stripe';
import { resolveSeatPriceId, resolveStorePriceId } from './utils/stripe-config';
import { BadRequestException, NotFoundException as NestNotFoundException } from '@nestjs/common';

type CustomerParams = {
  vendorId: string;
  stripeCustomerId: string;
  email?: string | null;
  billingName?: string | null;
  defaultPaymentMethodBrand?: string | null;
  defaultPaymentMethodLast4?: string | null;
};

type SubscriptionParams = {
  vendorId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: BillingSubscriptionStatus;
  stripeCustomerId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  trialEnd?: Date | null;
  quantity?: number | null;
  planKey?: string | null;
};

@Injectable()
export class BillingService {
  private readonly activeStatuses: BillingSubscriptionStatus[] = ['active', 'trialing'];

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(BillingPlan)
    private readonly plansRepo: Repository<BillingPlan>,
    @InjectRepository(BillingCustomer)
    private readonly customersRepo: Repository<BillingCustomer>,
    @InjectRepository(BillingSubscription)
    private readonly subscriptionsRepo: Repository<BillingSubscription>,
    @InjectRepository(BillingSubscriptionItem)
    private readonly subscriptionItemsRepo: Repository<BillingSubscriptionItem>,
    @InjectRepository(BillingInvoice)
    private readonly invoicesRepo: Repository<BillingInvoice>,
    @InjectRepository(BillingWebhookEvent)
    private readonly eventsRepo: Repository<BillingWebhookEvent>,
  ) {}

  async updateStoreQuantity(stripe: Stripe, params: { vendorId: string; quantity: number; priceId?: string }) {
    const storePriceId = params.priceId ?? resolveStorePriceId(this.config);
    if (!storePriceId) {
      throw new BadRequestException('Store price ID is not configured');
    }

    const subscription = await this.subscriptionsRepo.findOne({
      where: { vendorId: params.vendorId },
      order: { createdAt: 'DESC' },
    });
    const planKey = (subscription?.plan?.key as VendorPlanKey | undefined) ?? 'free';

    // If no real Stripe subscription exists (none or manual), create one for the add-on price
    if (!subscription || subscription.stripeSubscriptionId.startsWith('manual_')) {
      const customer = await this.ensureStripeCustomer(stripe, {
        vendorId: params.vendorId,
      });

      const createdSub = await stripe.subscriptions.create({
        customer: customer.stripeCustomerId,
        items: [
          {
            price: storePriceId,
            quantity: params.quantity,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: {
          vendorId: params.vendorId,
          planKey,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      const synced = await this.syncSubscriptionFromStripe({
        vendorId: params.vendorId,
        stripeSubscriptionId: createdSub.id,
        stripeCustomerId: (createdSub.customer as string) ?? null,
        stripePriceId: storePriceId,
        status: createdSub.status as BillingSubscriptionStatus,
        currentPeriodStart: this.unixToDate(createdSub.current_period_start),
        currentPeriodEnd: this.unixToDate(createdSub.current_period_end),
        cancelAtPeriodEnd: createdSub.cancel_at_period_end ?? false,
        canceledAt: this.unixToDate(createdSub.canceled_at),
        trialEnd: this.unixToDate(createdSub.trial_end),
        quantity: params.quantity,
        planKey,
      });

      const items = await this.syncSubscriptionItemsFromStripe({
        vendorId: params.vendorId,
        billingSubscriptionId: synced.id,
        items: createdSub.items,
      });

      const entitlements = await this.getVendorEntitlements(params.vendorId);
      const latestInvoice = createdSub.latest_invoice as Stripe.Invoice | null;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

      return {
        subscriptionId: createdSub.id,
        entitlements,
        items,
        latestInvoiceId: latestInvoice?.id ?? null,
        paymentIntentClientSecret: paymentIntent?.client_secret ?? null,
        paymentIntentStatus: paymentIntent?.status ?? null,
      };
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
      expand: ['items'],
    });

    // Prevent updates on incomplete subscriptions to avoid Stripe errors; surface a clear message.
    if (stripeSub.status === 'incomplete') {
      throw new BadRequestException(
        'Subscription requires payment before you can change store quantity. Please complete the payment first.',
      );
    }

    const existingItem = stripeSub.items?.data.find((item) => item.price?.id === storePriceId) ?? null;

    const updateParams: Stripe.SubscriptionUpdateParams = {
      proration_behavior: 'create_prorations',
      payment_behavior: 'pending_if_incomplete',
      items: existingItem
        ? [
            {
              id: existingItem.id,
              quantity: params.quantity,
            },
          ]
        : [
            {
              price: storePriceId,
              quantity: params.quantity,
            },
          ],
      expand: ['latest_invoice.payment_intent'],
    };

    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, updateParams);

    // Sync to local DB
    await this.syncSubscriptionFromStripe({
      vendorId: params.vendorId,
      stripeSubscriptionId: updated.id,
      stripePriceId: updated.items?.data?.[0]?.price?.id ?? storePriceId,
      status: updated.status as BillingSubscriptionStatus,
      stripeCustomerId: (updated.customer as string) ?? null,
      currentPeriodStart: this.unixToDate(updated.current_period_start),
      currentPeriodEnd: this.unixToDate(updated.current_period_end),
      cancelAtPeriodEnd: updated.cancel_at_period_end ?? false,
      canceledAt: this.unixToDate(updated.canceled_at),
      trialEnd: this.unixToDate(updated.trial_end),
      quantity: updated.items?.data?.[0]?.quantity ?? params.quantity,
    });

    const items = await this.syncSubscriptionItemsFromStripe({
      vendorId: params.vendorId,
      billingSubscriptionId: subscription.id,
      items: updated.items,
    });

    const entitlements = await this.getVendorEntitlements(params.vendorId);
    const latestInvoice = updated.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

    return {
      subscriptionId: updated.id,
      entitlements,
      items,
      latestInvoiceId: latestInvoice?.id ?? null,
      paymentIntentClientSecret: paymentIntent?.client_secret ?? null,
      paymentIntentStatus: paymentIntent?.status ?? null,
    };
  }

  private unixToDate(value?: number | null) {
    return value ? new Date(value * 1000) : null;
  }

  private mapPlanSummary(plan: BillingPlan): BillingPlanSummary {
    return {
      key: plan.key,
      name: plan.name,
      description: plan.description ?? null,
      interval: plan.interval,
      currency: plan.currency,
      unitAmountCents: plan.unitAmountCents,
      maxStores: plan.maxStores ?? null,
      stripePriceId: plan.stripePriceId,
    };
  }

  async ensureDefaultPlans(): Promise<BillingPlan[]> {
    await this.plansRepo.upsert(DEFAULT_VENDOR_PLANS, ['key']);
    return this.plansRepo.find({ where: { isActive: true } });
  }

  async listPlans(): Promise<BillingPlanSummary[]> {
    const plans = await this.ensureDefaultPlans();
    return plans
      .filter((plan) => plan.isActive && VISIBLE_VENDOR_PLAN_KEYS.includes(plan.key as VendorPlanKey))
      .map((plan) => this.mapPlanSummary(plan));
  }

  async applyPlanToVendor(vendorId: string, planKey: VendorPlanKey) {
    await this.ensureDefaultPlans();
    const plan = await this.findPlanByKey(planKey);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const existing = await this.subscriptionsRepo.findOne({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });

    const subscription =
      existing ??
      this.subscriptionsRepo.create({
        vendorId,
        stripeSubscriptionId: `manual_${vendorId}`,
        stripePriceId: plan.stripePriceId,
      });
    subscription.planId = plan.id;
    subscription.stripePriceId = plan.stripePriceId;
    subscription.status = 'active';
    subscription.quantity = 1;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = null;
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    subscription.trialEnd = null;

    await this.subscriptionsRepo.save(subscription);
    const entitlements = await this.getVendorEntitlements(vendorId);

    return { plan: this.mapPlanSummary(plan), entitlements };
  }

  async findPlanByKey(key: string) {
    return this.plansRepo.findOne({ where: { key, isActive: true } });
  }

  async findPlanByPriceId(stripePriceId: string) {
    return this.plansRepo.findOne({ where: { stripePriceId, isActive: true } });
  }

  async getOrCreateCustomer(params: CustomerParams): Promise<BillingCustomer> {
    const existing = await this.customersRepo.findOne({
      where: [{ vendorId: params.vendorId }, { stripeCustomerId: params.stripeCustomerId }],
    });

    const entity =
      existing ??
      this.customersRepo.create({
        vendorId: params.vendorId,
        stripeCustomerId: params.stripeCustomerId,
      });
    entity.email = params.email ?? entity.email ?? null;
    entity.billingName = params.billingName ?? entity.billingName ?? null;
    entity.defaultPaymentMethodBrand =
      params.defaultPaymentMethodBrand ?? entity.defaultPaymentMethodBrand ?? null;
    entity.defaultPaymentMethodLast4 =
      params.defaultPaymentMethodLast4 ?? entity.defaultPaymentMethodLast4 ?? null;

    return this.customersRepo.save(entity);
  }

  async syncSubscriptionFromStripe(input: SubscriptionParams): Promise<BillingSubscription> {
    const plan =
      input.planKey && input.planKey.length > 0
        ? await this.findPlanByKey(input.planKey)
        : await this.findPlanByPriceId(input.stripePriceId);

    const customer = input.stripeCustomerId
      ? await this.getOrCreateCustomer({
          vendorId: input.vendorId,
          stripeCustomerId: input.stripeCustomerId,
        })
      : null;

    const existing = await this.subscriptionsRepo.findOne({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
    });

    const subscription =
      existing ??
      this.subscriptionsRepo.create({
        vendorId: input.vendorId,
        stripeSubscriptionId: input.stripeSubscriptionId,
      });
    subscription.vendorId = input.vendorId;
    subscription.billingCustomerId = customer?.id ?? subscription.billingCustomerId ?? null;
    subscription.planId = plan?.id ?? subscription.planId ?? null;
    subscription.stripePriceId = input.stripePriceId;
    subscription.status = input.status;
    subscription.quantity = input.quantity ?? subscription.quantity ?? 1;
    subscription.currentPeriodStart = input.currentPeriodStart ?? null;
    subscription.currentPeriodEnd = input.currentPeriodEnd ?? null;
    subscription.cancelAtPeriodEnd = input.cancelAtPeriodEnd ?? subscription.cancelAtPeriodEnd ?? false;
    subscription.canceledAt = input.canceledAt ?? null;
    subscription.trialEnd = input.trialEnd ?? null;

    return this.subscriptionsRepo.save(subscription);
  }

  async ensureStripeCustomer(
    stripe: Stripe,
    params: { vendorId: string; email?: string | null; billingName?: string | null },
  ): Promise<BillingCustomer> {
    const existing = await this.customersRepo.findOne({ where: { vendorId: params.vendorId } });
    if (existing) {
      return existing;
    }

    const customer = await stripe.customers.create({
      email: params.email ?? undefined,
      name: params.billingName ?? undefined,
      metadata: {
        vendorId: params.vendorId,
      },
    });

    return this.getOrCreateCustomer({
      vendorId: params.vendorId,
      stripeCustomerId: customer.id,
      email: params.email,
      billingName: params.billingName,
    });
  }

  async recordInvoiceFromStripe(invoice: Stripe.Invoice, vendorId?: string) {
    const stripeSubscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id ?? null;

    const subscription = stripeSubscriptionId
      ? await this.subscriptionsRepo.findOne({
          where: { stripeSubscriptionId },
        })
      : null;

    const resolvedVendorId = vendorId ?? (subscription?.vendorId ?? (invoice.metadata?.vendorId as string | undefined));
    if (!resolvedVendorId) {
      return null;
    }

    const paidAtSeconds = invoice.status_transitions?.paid_at;
    const issuedAtSeconds = invoice.created;
    const invoiceRecord = {
      vendorId: resolvedVendorId,
      billingSubscriptionId: subscription?.id ?? null,
      stripeInvoiceId: invoice.id,
      stripeInvoiceNumber: invoice.number ?? null,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
      amountPaidCents: invoice.amount_paid ?? null,
      currency: invoice.currency ?? 'usd',
      status: invoice.status ?? null,
      issuedAt: issuedAtSeconds ? new Date(issuedAtSeconds * 1000) : null,
      paidAt: paidAtSeconds ? new Date(paidAtSeconds * 1000) : null,
    };

    await this.invoicesRepo.upsert(invoiceRecord, ['stripeInvoiceId']);
    return this.invoicesRepo.findOne({ where: { stripeInvoiceId: invoice.id } });
  }

  async recordWebhookEvent(event: Stripe.Event, processedAt?: Date) {
    console.log('IS THIS RECORDING THE EVENT?')
    const existing = await this.eventsRepo.findOne({
      where: { stripeEventId: event.id },
    });

    if (existing) {
      if (processedAt) {
        existing.processedAt = processedAt;
        await this.eventsRepo.save(existing);
      }
      return existing;
    }

    const created = this.eventsRepo.create({
      stripeEventId: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
      processedAt: processedAt ?? null,
    });
    return this.eventsRepo.save(created);
  }

  async getVendorEntitlements(vendorId: string): Promise<BillingEntitlements | null> {
    const subscription = await this.subscriptionsRepo.findOne({
      where: { vendorId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription || !subscription.plan) {
      const freePlan = DEFAULT_VENDOR_PLANS.find((plan) => plan.key === 'free');
      return {
        planKey: freePlan?.key ?? 'free',
        status: 'active',
        currentPeriodEnd: null,
        isActive: true,
        seatsAllowed: freePlan?.seatsIncluded ?? 1,
        storesAllowed: freePlan?.maxStores ?? 0,
        productsPerStoreAllowed: PRODUCTS_PER_STORE_BY_PLAN['free'],
        seatsAddOns: 0,
        storesAddOns: 0,
      };
    }

    const items = await this.subscriptionItemsRepo.find({
      where: { billingSubscriptionId: subscription.id },
    });

    const now = new Date();
    const inPeriod = !subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > now.getTime();
    const isActive = this.activeStatuses.includes(subscription.status) && inPeriod;

    const seatsIncluded = subscription.plan.seatsIncluded ?? 0;
    const baseSeats = subscription.quantity ?? 0;
    const seatAddOns = items
      .filter((item) => item.featureType === 'seats')
      .reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unitsPerQuantity ?? 1), 0);
    const seatsAllowed = isActive ? Math.max(baseSeats + seatAddOns, seatsIncluded) : 0;

    const baseStores = subscription.plan.maxStores ?? 0;
    const storeAddOns = items
      .filter((item) => item.featureType === 'stores')
      .reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unitsPerQuantity ?? 1), 0);
    let storesAllowed: number | null;
    if (!isActive) {
      storesAllowed = 0;
    } else if (baseStores === null || baseStores === undefined) {
      storesAllowed = storeAddOns > 0 ? storeAddOns : null;
    } else {
      storesAllowed = baseStores + storeAddOns;
    }

    const planKey = (subscription.plan.key as VendorPlanKey | undefined) ?? null;
    const productsPerStoreAllowed =
      planKey && planKey in PRODUCTS_PER_STORE_BY_PLAN
        ? PRODUCTS_PER_STORE_BY_PLAN[planKey]
        : null;

    return {
      planKey: subscription.plan.key ?? null,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      isActive,
      seatsAllowed,
      storesAllowed,
      productsPerStoreAllowed,
      seatsAddOns: seatAddOns,
      storesAddOns: storeAddOns,
    };
  }

  async syncSubscriptionItemsFromStripe(params: {
    vendorId: string;
    billingSubscriptionId: string;
    items: Stripe.ApiList<Stripe.SubscriptionItem> | Stripe.SubscriptionItem[];
  }) {
    const list = Array.isArray(params.items) ? params.items : params.items.data;
    const payloads = list.map((item) => {
      const price = item.price;
      const metadata = price?.metadata ?? item.metadata ?? {};
      const featureType =
        (metadata.feature_type as string | undefined) ??
        (metadata.featureType as string | undefined) ??
        null;
      const unitsPerQuantity =
        Number(metadata.units_per_quantity ?? metadata.unitsPerQuantity ?? 1) || 1;
      const storePriceId = resolveStorePriceId(this.config);
      const seatPriceId = resolveSeatPriceId(this.config);
      const resolvedFeatureType =
        featureType ??
        (price?.id === storePriceId ? 'stores' : null) ??
        (price?.id === seatPriceId ? 'seats' : null);

      return {
        billingSubscriptionId: params.billingSubscriptionId,
        vendorId: params.vendorId,
        stripePriceId: price?.id ?? item.price?.id ?? item.id,
        stripeProductId: price?.product?.toString() ?? null,
        quantity: item.quantity ?? 0,
        featureType: resolvedFeatureType,
        unitsPerQuantity,
      };
    });

    for (const payload of payloads) {
      await this.subscriptionItemsRepo.upsert(payload, {
        conflictPaths: ['billingSubscriptionId', 'stripePriceId'],
      });
    }

    // Cleanup any items no longer present
    const keepPriceIds = payloads.map((p) => p.stripePriceId);
    await this.subscriptionItemsRepo
      .createQueryBuilder()
      .delete()
      .where('billing_subscription_id = :subId', { subId: params.billingSubscriptionId })
      .andWhere('stripe_price_id NOT IN (:...ids)', { ids: keepPriceIds.length ? keepPriceIds : ['__none__'] })
      .execute();
  }
}
