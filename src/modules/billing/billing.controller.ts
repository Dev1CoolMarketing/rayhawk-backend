import { BadRequestException, Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/decorators/user.decorator';
import { ApiAuthGuard } from '../../common/guards/api-auth.guard';
import { Vendor } from '../../entities';
import { RequestUser } from '../auth/types/request-user.interface';
import { CheckoutDto, CheckoutMode } from './dto/checkout.dto';
import { SeatsCheckoutDto } from './dto/seats-checkout.dto';
import { BillingService } from './billing.service';
import { resolveSeatPriceId, resolveStorePriceId, resolveStripeSecrets } from './utils/stripe-config';
import { Response } from 'express';
import { UpdateStoreQuantityDto } from './dto/update-store-quantity.dto';
import { UpdateCollectionMethodDto } from './dto/update-collection-method.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SchedulePlanChangeDto } from './dto/schedule-plan-change.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);
  private readonly stripe?: Stripe;
  private readonly appUrl: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly billingService: BillingService,
    @InjectRepository(Vendor) private readonly vendorsRepo: Repository<Vendor>,
  ) {
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:8080';
    this.frontendUrl =
      config.get<string>('FRONTEND_VENDOR_APP_URL') ??
      config.get<string>('FRONTEND_APP_URL') ??
      'http://localhost:3000';
    const { secret } = resolveStripeSecrets(config);
    if (secret) {
      this.stripe = new Stripe(secret, { apiVersion: '2024-04-10' });
    }
  }

  @Post('checkout')
  @UseGuards(ApiAuthGuard)
  async checkout(@Body() dto: CheckoutDto, @User() user: RequestUser) {
    if (!this.stripe) {
      return { url: `${this.appUrl}/billing/configure-stripe` };
    }

    if (dto.mode === CheckoutMode.Subscription && !dto.priceId) {
      throw new BadRequestException('priceId is required for subscription mode');
    }

    if (dto.mode === CheckoutMode.Subscription && !dto.vendorId) {
      throw new BadRequestException('vendorId is required for subscription mode');
    }

    if (dto.mode === CheckoutMode.Payment && !dto.amount) {
      throw new BadRequestException('amount is required for payment mode');
    }

    this.logger.log(
      `Creating checkout session: mode=${dto.mode}, vendorId=${dto.vendorId ?? 'none'}, priceId=${
        dto.priceId ?? 'none'
      }, quantity=${dto.quantity ?? 1}`,
    );

    const vendor = dto.vendorId ? await this.vendorsRepo.findOne({ where: { id: dto.vendorId } }) : null;
    const customer = vendor
      ? await this.billingService.ensureStripeCustomer(this.stripe, {
          vendorId: vendor.id,
          email: user.email,
          billingName: vendor.name ?? undefined,
        })
      : null;

    const session = await this.stripe.checkout.sessions.create({
      mode: dto.mode,
      customer: customer?.stripeCustomerId,
      success_url: `${this.appUrl}/v1/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appUrl}/v1/billing/cancel`,
      line_items:
        dto.mode === CheckoutMode.Subscription
          ? [
              {
                price: dto.priceId,
                quantity: dto.quantity ?? 1,
              },
            ]
          : [
              {
                price_data: {
                  currency: 'usd',
                  unit_amount: Math.round((dto.amount ?? 0) * 100),
                  product_data: {
                    name: 'One-time charge',
                  },
                },
                quantity: 1,
              },
            ],
      metadata: {
        vendorId: dto.vendorId ?? '',
        accountId: user.id,
      },
      subscription_data:
        dto.mode === CheckoutMode.Subscription
          ? {
              metadata: {
                vendorId: dto.vendorId ?? '',
                accountId: user.id,
              },
            }
          : undefined,
    });

    return { url: session.url };
  }

  @Post('seats/intent')
  @UseGuards(ApiAuthGuard)
  async createSeatSubscriptionIntent(@Body() dto: SeatsCheckoutDto, @User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    const entitlements = await this.billingService.getVendorEntitlements(vendor.id);
    if (!entitlements?.planKey || entitlements.planKey === 'free') {
      throw new BadRequestException('Seat add-ons require a Bronze plan or higher.');
    }

    const seatPriceId = resolveSeatPriceId(this.config);
    if (!seatPriceId) {
      throw new BadRequestException('Seat price is not configured');
    }

    const customer = await this.billingService.ensureStripeCustomer(this.stripe, {
      vendorId: vendor.id,
      email: user.email,
      billingName: vendor.name ?? undefined,
    });

    const subscription = await this.stripe.subscriptions.create({
      customer: customer.stripeCustomerId,
      items: [
        {
          price: seatPriceId,
          quantity: dto.quantity,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata: {
        vendorId: vendor.id,
        accountId: user.id,
      },
      expand: ['latest_invoice.payment_intent'],
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;
    const clientSecret = paymentIntent?.client_secret;
    if (!clientSecret) {
      throw new BadRequestException('Unable to create payment intent for seats');
    }

    return {
      subscriptionId: subscription.id,
      clientSecret,
    };
  }

  @Post('stores/quantity')
  @UseGuards(ApiAuthGuard)
  async updateStoreQuantity(@Body() dto: UpdateStoreQuantityDto, @User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    const priceId = dto.priceId ?? resolveStorePriceId(this.config);
    const result = await this.billingService.updateStoreQuantity(this.stripe, {
      vendorId: vendor.id,
      quantity: dto.quantity,
      priceId,
    });
    return result;
  }

  @Get('summary')
  @UseGuards(ApiAuthGuard)
  async summary(@User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    return this.billingService.getBillingSummary(this.stripe, { vendorId: vendor.id });
  }

  @Post('collection-method')
  @UseGuards(ApiAuthGuard)
  async updateCollectionMethod(@Body() dto: UpdateCollectionMethodDto, @User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    return this.billingService.updateCollectionMethod(this.stripe, {
      vendorId: vendor.id,
      collectionMethod: dto.collectionMethod,
      daysUntilDue: dto.daysUntilDue,
    });
  }

  @Post('portal')
  @UseGuards(ApiAuthGuard)
  async createPortalSession(@User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    const customer = await this.billingService.ensureStripeCustomer(this.stripe, {
      vendorId: vendor.id,
      email: user.email,
      billingName: vendor.name ?? undefined,
    });
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${this.frontendUrl}/dashboard/plan`,
    });
    return { url: session.url };
  }

  @Post('cancel')
  @UseGuards(ApiAuthGuard)
  async cancelSubscription(@Body() dto: CancelSubscriptionDto, @User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    return this.billingService.cancelSubscription(this.stripe, {
      vendorId: vendor.id,
      cancelAtPeriodEnd: true,
    });
  }

  @Post('schedule-plan-change')
  @UseGuards(ApiAuthGuard)
  async schedulePlanChange(@Body() dto: SchedulePlanChangeDto, @User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
    }
    return this.billingService.schedulePlanChange(this.stripe, {
      vendorId: vendor.id,
      planKey: dto.planKey,
    });
  }

  @UseGuards()
  @Get('success')
  async successRedirect(@Query('session_id') sessionId: string | undefined, @Res() res: Response) {
    if (this.stripe && sessionId) {
      try {
        const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription', 'subscription.items'],
        });
        const subscription = session.subscription as Stripe.Subscription | null;
        const vendorId = (session.metadata?.vendorId as string | undefined) ?? null;

        if (subscription && vendorId) {
          const synced = await this.billingService.syncSubscriptionFromStripe({
            vendorId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: (subscription.customer as string) ?? null,
            stripePriceId: subscription.items?.data?.[0]?.price?.id ?? '',
            status: subscription.status as Stripe.Subscription.Status,
            currentPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : null,
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            quantity: subscription.items?.data?.[0]?.quantity ?? 1,
            planKey: null,
            collectionMethod: subscription.collection_method ?? null,
          });
          if (synced?.id) {
            await this.billingService.syncSubscriptionItemsFromStripe({
              vendorId,
              billingSubscriptionId: synced.id,
              items: subscription.items,
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to sync checkout session ${sessionId}: ${error instanceof Error ? error.message : error}`);
      }
    }
    res.redirect(`${this.frontendUrl}/dashboard/plan?checkout=success`);
  }

  @UseGuards()
  @Get('cancel')
  cancelRedirect(@Res() res: Response) {
    res.redirect(`${this.frontendUrl}/dashboard/plan?checkout=cancel`);
  }
}
