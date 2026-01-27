import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
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
    return this.reviewsService.createReview(storeId, user.id, user.role, dto, Boolean(user.hasCustomerProfile));
  }

  @Delete(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteReview(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @User() user: RequestUser,
  ) {
    return this.reviewsService.deleteReview(storeId, reviewId, user.id, user.role, Boolean(user.hasCustomerProfile));
  }
}

@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getProductReviews(@Param('productId', new ParseUUIDPipe()) productId: string, @User() user?: RequestUser) {
    return this.reviewsService.listProductReviews(productId, user?.id);
  }

  @Get('summary')
  getProductSummary(@Param('productId', new ParseUUIDPipe()) productId: string) {
    return this.reviewsService.getProductReviewSummary(productId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProductReview(@Param('productId', new ParseUUIDPipe()) productId: string, @User() user: RequestUser) {
    return this.reviewsService.getUserProductReview(productId, user.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createProductReview(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: CreateReviewDto,
    @User() user: RequestUser,
  ) {
    return this.reviewsService.createProductReview(
      productId,
      user.id,
      user.role,
      dto,
      Boolean(user.hasCustomerProfile),
    );
  }

  @Delete(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteProductReview(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @User() user: RequestUser,
  ) {
    return this.reviewsService.deleteProductReview(
      productId,
      reviewId,
      user.id,
      user.role,
      Boolean(user.hasCustomerProfile),
    );
  }
}

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewSummariesController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('summaries')
  getSummaries(@Query('storeIds') storeIds?: string | string[]) {
    const list = Array.isArray(storeIds) ? storeIds : typeof storeIds === 'string' ? storeIds.split(',') : [];
    return this.reviewsService.getStoreReviewSummaries(list);
  }

  @Get('product-summaries')
  getProductSummaries(@Query('productIds') productIds?: string | string[]) {
    const list = Array.isArray(productIds) ? productIds : typeof productIds === 'string' ? productIds.split(',') : [];
    return this.reviewsService.getProductReviewSummaries(list);
  }
}
