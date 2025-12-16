import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review, ReviewTag, Store, User } from '../../entities';
import { ReviewsController, ReviewSummariesController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewTag, Store, User])],
  controllers: [ReviewsController, ReviewSummariesController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
