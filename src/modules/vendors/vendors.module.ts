import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from '../../entities';
import { UsersModule } from '../users/users.module';
import { BillingModule } from '../billing/billing.module';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor]), UsersModule, BillingModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
