import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product, Review, ReviewTag, Store, User } from '../../entities';
import {
  ProductReviewsController,
  ReviewSummariesController,
  ReviewsController,
} from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewTag, Store, User, Product])],
  controllers: [ReviewsController, ProductReviewsController, ReviewSummariesController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
