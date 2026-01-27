import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductCategory, Store } from '../../entities';
import { ProductsController } from './products.controller';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductsService } from './products.service';
import { MediaModule } from '../media/media.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Store, ProductCategory]), MediaModule, BillingModule],
  controllers: [ProductsController, ProductCategoriesController],
  providers: [ProductsService],
})
export class ProductsModule {}
