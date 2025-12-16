import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Store, Vendor, Product } from '../../entities';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { MediaModule } from '../media/media.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Vendor, Product]), MediaModule, BillingModule, ConfigModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
