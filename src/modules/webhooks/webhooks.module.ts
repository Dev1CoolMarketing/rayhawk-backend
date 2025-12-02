import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadCredit, Subscription } from '../../entities';
import { BillingModule } from '../billing/billing.module';
import { StripeWebhookController } from './stripe.webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, LeadCredit]), BillingModule],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}
