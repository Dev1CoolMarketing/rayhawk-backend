import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Store } from '../../entities';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Store]), MediaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
