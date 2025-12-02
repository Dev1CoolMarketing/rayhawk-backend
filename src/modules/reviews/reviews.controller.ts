import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { RequestUser } from '../auth/types/request-user.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getStoreReviews(@Param('storeId', new ParseUUIDPipe()) storeId: string, @User() user?: RequestUser) {
    return this.reviewsService.listStoreReviews(storeId, user?.id);
  }

  @Get('summary')
  getSummary(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return this.reviewsService.getStoreReviewSummary(storeId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyReview(@Param('storeId', new ParseUUIDPipe()) storeId: string, @User() user: RequestUser) {
    return this.reviewsService.getUserReview(storeId, user.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() dto: CreateReviewDto,
    @User() user: RequestUser,
  ) {
    return this.reviewsService.createReview(storeId, user.id, user.role, dto);
  }

  @Delete(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteReview(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @User() user: RequestUser,
  ) {
    return this.reviewsService.deleteReview(storeId, reviewId, user.id, user.role);
  }
}
