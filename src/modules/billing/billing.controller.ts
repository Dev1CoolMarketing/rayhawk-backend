import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import Stripe from 'stripe';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../auth/types/request-user.interface';
import { CheckoutDto, CheckoutMode } from './dto/checkout.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  private readonly stripe?: Stripe;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    const secret = config.get<string>('STRIPE_SECRET_KEY');
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:8080';
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

    if (dto.mode === CheckoutMode.Payment && !dto.amount) {
      throw new BadRequestException('amount is required for payment mode');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: dto.mode,
      success_url: `${this.appUrl}/billing/success`,
      cancel_url: `${this.appUrl}/billing/cancel`,
      line_items:
        dto.mode === CheckoutMode.Subscription
          ? [
              {
                price: dto.priceId,
                quantity: 1,
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
}
