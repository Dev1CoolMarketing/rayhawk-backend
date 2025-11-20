import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';

@Module({
  imports: [ConfigModule],
  controllers: [BillingController],
  providers: [],
})
export class BillingModule {}
