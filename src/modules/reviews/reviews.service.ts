import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Review, ReviewTag, Store, User } from '../../entities';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto, ReviewSummaryDto } from './dto/review-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(ReviewTag) private readonly tagsRepo: Repository<ReviewTag>,
    @InjectRepository(Store) private readonly storesRepo: Repository<Store>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async createReview(storeId: string, userId: string, role: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    if (role !== 'customer') {
      throw new ForbiddenException('Only customers can submit reviews');
    }
    const store = await this.storesRepo.findOne({ where: { id: storeId, deletedAt: null as any } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const existing = await this.reviewsRepo.findOne({
      where: { storeId, userId, deletedAt: null as any },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this store');
    }

    const tags = dto.tags?.length ? await this.resolveTags(dto.tags) : [];

    const review = this.reviewsRepo.create({
      storeId,
      userId,
      rating: dto.rating,
      comment: dto.comment ?? null,
      status: 'published',
      tags,
    });
    const saved = await this.reviewsRepo.save(review);
    return this.mapReview(saved, userId);
  }

  async listStoreReviews(storeId: string, currentUserId?: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsRepo.find({
      where: { storeId, status: 'published' },
      relations: ['user', 'user.customerProfile'],
      order: { createdAt: 'DESC' },
    });
    return reviews.map((review) => this.mapReview(review, currentUserId));
  }

  async getUserReview(storeId: string, userId: string): Promise<ReviewResponseDto | null> {
    const review = await this.reviewsRepo.findOne({
      where: { storeId, userId, deletedAt: null as any },
      relations: ['user', 'user.customerProfile'],
    });
    return review ? this.mapReview(review, userId) : null;
  }

  async deleteReview(storeId: string, reviewId: string, userId: string, role: string): Promise<{ success: true }> {
    if (role !== 'customer') {
      throw new ForbiddenException('Only customers can delete reviews');
    }
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId, storeId } });
    if (!review || review.deletedAt) {
      return { success: true };
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }
    await this.reviewsRepo.softRemove(review);
    return { success: true };
  }

  async getStoreReviewSummary(storeId: string): Promise<ReviewSummaryDto> {
    const rows = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.storeId = :storeId', { storeId })
      .andWhere('review.status = :status', { status: 'published' })
      .groupBy('review.rating')
      .getRawMany<{ rating: number; count: string }>();

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rows.forEach((row) => {
      const rating = Number(row.rating);
      counts[rating] = Number(row.count) || 0;
    });
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const averageRating =
      total === 0
        ? 0
        : Object.entries(counts).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0) / total;

    const tagRows = await this.tagsRepo
      .createQueryBuilder('tag')
      .select('tag.id', 'id')
      .addSelect('tag.key', 'key')
      .addSelect('tag.label', 'label')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('tag.reviews', 'review', 'review.storeId = :storeId AND review.status = :status', {
        storeId,
        status: 'published',
      })
      .groupBy('tag.id')
      .addGroupBy('tag.key')
      .addGroupBy('tag.label')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ id: string; key: string; label: string; count: string }>();

    const topTags = tagRows.map((row) => ({
      key: row.key,
      label: row.label,
      count: Number(row.count) || 0,
    }));

    return {
      storeId,
      averageRating,
      total,
      counts,
      topTags,
    };
  }

  private async resolveTags(keys: string[]): Promise<ReviewTag[]> {
    const tags = await this.tagsRepo.find({ where: { key: In(keys) } });
    return tags;
  }

  private mapReview(review: Review, currentUserId?: string): ReviewResponseDto {
    const tags = (review.tags ?? []).map((tag) => ({ key: tag.key, label: tag.label }));
    const username =
      (review.user as any)?.customerProfile?.username ??
      (review.user as any)?.email?.split('@')[0] ??
      null;
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment ?? null,
      tags,
      username,
      createdAt: review.createdAt.toISOString(),
      canDelete: currentUserId ? review.userId === currentUserId : false,
    };
  }
}
