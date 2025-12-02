import { BadRequestException, Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Vendor } from '../../entities';
import { RequestUser } from '../auth/types/request-user.interface';
import { CheckoutDto, CheckoutMode } from './dto/checkout.dto';
import { SeatsCheckoutDto } from './dto/seats-checkout.dto';
import { BillingService } from './billing.service';
import { resolveSeatPriceId, resolveStripeSecrets } from './utils/stripe-config';
import { Response } from 'express';
import { UpdateStoreQuantityDto } from './dto/update-store-quantity.dto';
import { resolveStorePriceId } from './utils/stripe-config';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard)
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
    this.frontendUrl = config.get<string>('FRONTEND_APP_URL') ?? 'http://localhost:3000';
    const { secret } = resolveStripeSecrets(config);
    if (secret) {
      this.stripe = new Stripe(secret, { apiVersion: '2024-04-10' });
    }
  }

  @Post('checkout')
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

    const session = await this.stripe.checkout.sessions.create({
      mode: dto.mode,
      success_url: `${this.appUrl}/v1/billing/success`,
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
    });

    return { url: session.url };
  }

  @Post('seats/intent')
  async createSeatSubscriptionIntent(@Body() dto: SeatsCheckoutDto, @User() user: RequestUser) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    if (!vendor) {
      throw new BadRequestException('Vendor account not found');
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

  @Get('success')
  successRedirect(@Res() res: Response) {
    res.redirect(`${this.frontendUrl}/dashboard/plan?checkout=success`);
  }

  @Get('cancel')
  cancelRedirect(@Res() res: Response) {
    res.redirect(`${this.frontendUrl}/dashboard/plan?checkout=cancel`);
  }
}
