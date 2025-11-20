import { BadRequestException, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { LeadCredit, Subscription } from '../../entities';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly stripe?: Stripe;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(LeadCredit)
    private readonly leadCreditsRepository: Repository<LeadCredit>,
  ) {
    const secret = config.get<string>('STRIPE_SECRET_KEY');
    if (secret) {
      this.stripe = new Stripe(secret, { apiVersion: '2024-04-10' });
    }
  }

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | string[],
  ) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
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
    const event = this.stripe.webhooks.constructEvent(rawBody, resolvedSignature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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

    await this.subscriptionsRepository.upsert(
      {
        vendorId,
        stripeCustomerId: (record.customer as string) ?? session?.customer?.toString(),
        stripeSubscriptionId: record.id,
        status: record.status,
        currentPeriodEnd: record.current_period_end
          ? new Date(record.current_period_end * 1000)
          : undefined,
      },
      {
        conflictPaths: ['stripeSubscriptionId'],
      },
    );
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
