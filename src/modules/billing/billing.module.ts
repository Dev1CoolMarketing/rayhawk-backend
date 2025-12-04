import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BillingCustomer,
  BillingInvoice,
  BillingPlan,
  BillingSubscription,
  BillingSubscriptionItem,
  BillingWebhookEvent,
  Vendor,
  User,
} from '../../entities';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      BillingPlan,
      BillingCustomer,
      BillingSubscription,
      BillingSubscriptionItem,
      BillingInvoice,
      BillingWebhookEvent,
      Vendor,
      User,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
