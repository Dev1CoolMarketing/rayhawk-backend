import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadCredit, Subscription } from '../../entities';
import { StripeWebhookController } from './stripe.webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, LeadCredit])],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}
