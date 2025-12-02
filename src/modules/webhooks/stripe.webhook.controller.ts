import { BadRequestException, Controller, Headers, Logger, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { LeadCredit, Subscription } from '../../entities';
import { BillingService } from '../billing/billing.service';
import { BillingSubscriptionStatus } from '../billing/types/billing.types';
import { resolveStripeSecrets } from '../billing/utils/stripe-config';

@ApiTags('Webhooks')
@Controller('webhooks')
export class  StripeWebhookController {
  private readonly stripe?: Stripe;
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(LeadCredit)
    private readonly leadCreditsRepository: Repository<LeadCredit>,
    private readonly billingService: BillingService,
  ) {
    const { secret } = resolveStripeSecrets(config);
    if (secret) {
      this.stripe = new Stripe(secret, { apiVersion: '2024-04-10' });
    }
  }

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | string[],
  ) {
    this.logger.log(
      `Incoming Stripe webhook hit; signature present: ${signature}, content-length: ${
        req.headers['content-length'] ?? 'unknown'
      }`,
    );

    const { webhookSecret } = resolveStripeSecrets(this.config);
    if (!this.stripe || !webhookSecret) {
      return { received: true };
    }

    const resolvedSignature = Array.isArray(signature) ? signature[0] : signature;
    if (!resolvedSignature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body in Stripe webhook request');
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, resolvedSignature, webhookSecret);
    } catch (err) {
      this.logger.error(`Stripe signature verification failed: ${(err as Error).message}`);
      throw err;
    }

    this.logger.log(`Stripe event received: ${event.type} (${event.id})`);

    const existingEvent = await this.billingService.recordWebhookEvent(event);
    if (existingEvent.processedAt) {
      return { received: true };
    }
    console.log('THIS IS HIT HERE?');
    console.log('THIS IS EVENT TYPE', event)
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.resumed':
      case 'customer.subscription.paused':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.finalized':
        await this.handleInvoice(event.data.object as Stripe.Invoice);
        break;
      case 'payment_intent.succeeded':
        this.logger.log(`Stripe payment_intent.succeeded received: ${(event.data.object as Stripe.PaymentIntent).id}`);
        break;
      default:
        break;
    }

    await this.billingService.recordWebhookEvent(event, new Date());

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const email = session.customer_details?.email ?? session.customer_email ?? 'unknown';
    this.logger.log(
      `Stripe checkout completed: session=${session.id}, mode=${session.mode}, email=${email}, subscription=${session.subscription ?? 'n/a'}`,
    );
    if (session.mode === 'subscription' && session.subscription) {
      await this.syncSubscription(session.subscription as Stripe.Subscription | string, session);
    } else if (session.mode === 'payment') {
      const credits = Number(session.metadata?.credits ?? 10);
      const accountId = session.metadata?.accountId;
      if (accountId) {
        await this.creditLeadAccount(accountId, credits);
      }
    }
  }

  private async syncSubscription(subscription: Stripe.Subscription | string, session?: Stripe.Checkout.Session) {
    if (!this.stripe) {
      return;
    }
    const record =
      typeof subscription === 'string' ? await this.stripe.subscriptions.retrieve(subscription) : subscription;

    const vendorId = record.metadata?.vendorId ?? session?.metadata?.vendorId;
    if (!vendorId) {
      return;
    }

    const priceId =
      record.items?.data?.[0]?.price?.id ?? (session?.metadata?.priceId as string | undefined) ?? null;
    if (!priceId) {
      return;
    }

    const billingSubscription = await this.billingService.syncSubscriptionFromStripe({
      vendorId,
      stripeSubscriptionId: record.id,
      stripeCustomerId: (record.customer as string) ?? session?.customer?.toString() ?? null,
      stripePriceId: priceId,
      status: record.status as BillingSubscriptionStatus,
      currentPeriodStart: this.unixToDate(record.current_period_start),
      currentPeriodEnd: this.unixToDate(record.current_period_end),
      cancelAtPeriodEnd: record.cancel_at_period_end ?? false,
      canceledAt: this.unixToDate(record.canceled_at),
      trialEnd: this.unixToDate(record.trial_end),
      quantity: record.items?.data?.[0]?.quantity ?? null,
      planKey:
        (record.metadata?.planKey as string | undefined) ??
        (session?.metadata?.planKey as string | undefined) ??
        null,
    });

    if (billingSubscription?.id) {
      await this.billingService.syncSubscriptionItemsFromStripe({
        vendorId,
        billingSubscriptionId: billingSubscription.id,
        items: record.items?.data ?? [],
      });
    }

    await this.subscriptionsRepository.upsert(
      {
        vendorId,
        stripeCustomerId: (record.customer as string) ?? session?.customer?.toString(),
        stripeSubscriptionId: record.id,
        status: record.status,
        currentPeriodEnd: this.unixToDate(record.current_period_end) ?? undefined,
      },
      {
        conflictPaths: ['stripeSubscriptionId'],
      },
    );
  }

  private async handleInvoice(invoice: Stripe.Invoice) {
    const vendorId = (invoice.metadata?.vendorId as string | undefined) ?? undefined;
    await this.billingService.recordInvoiceFromStripe(invoice, vendorId);
  }

  private unixToDate(value?: number | null) {
    return value ? new Date(value * 1000) : null;
  }

  private async creditLeadAccount(accountId: string, credits: number) {
    await this.leadCreditsRepository.query(
      `INSERT INTO core.lead_credits(account_id, credits, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (account_id) DO UPDATE
       SET credits = core.lead_credits.credits + EXCLUDED.credits,
           updated_at = now()`,
      [accountId, credits],
    );
  }
}
