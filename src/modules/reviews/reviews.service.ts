import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Product, Review, ReviewTag, Store, User } from '../../entities';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto, ReviewSummaryDto } from './dto/review-response.dto';

const STORE_REVIEW_CRITERIA = ['provider_quality', 'communication_responsiveness', 'process_convenience'] as const;
const PRODUCT_REVIEW_CRITERIA = ['effectiveness', 'stability', 'value'] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_REGEX.test(value);

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(ReviewTag) private readonly tagsRepo: Repository<ReviewTag>,
    @InjectRepository(Store) private readonly storesRepo: Repository<Store>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
  ) {}

  async createReview(
    storeId: string,
    userId: string,
    role: string,
    dto: CreateReviewDto,
    hasCustomerProfile = false,
  ): Promise<ReviewResponseDto> {
    if (role !== 'customer' && !hasCustomerProfile) {
      throw new ForbiddenException('Only customers can submit reviews');
    }
    const store = await this.storesRepo.findOne({ where: { id: storeId, deletedAt: null as any } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const existing = await this.reviewsRepo.findOne({
      where: { storeId, productId: IsNull(), userId, deletedAt: null as any },
      relations: ['tags'],
    });

    const hasCriteriaRatings = dto.criteriaRatings !== undefined;
    const criteriaRatings = hasCriteriaRatings
      ? this.sanitizeCriteriaRatings(dto.criteriaRatings, STORE_REVIEW_CRITERIA)
      : existing?.criteriaRatings ?? null;
    const tags = dto.tags?.length ? await this.resolveTags(dto.tags) : [];

    if (existing) {
      existing.rating = dto.rating;
      existing.comment = dto.comment ?? null;
      if (hasCriteriaRatings) {
        existing.criteriaRatings = criteriaRatings;
      }
      existing.tags = tags;
      existing.status = 'published';
      const saved = await this.reviewsRepo.save(existing);
      const withUser = await this.loadReviewWithUser(saved.id);
      return this.mapReview(withUser ?? saved, userId);
    }

    const review = this.reviewsRepo.create({
      storeId,
      productId: null,
      userId,
      rating: dto.rating,
      comment: dto.comment ?? null,
      criteriaRatings: hasCriteriaRatings ? criteriaRatings : null,
      status: 'published',
      tags,
    });
    const saved = await this.reviewsRepo.save(review);
    const withUser = await this.loadReviewWithUser(saved.id);
    return this.mapReview(withUser ?? saved, userId);
  }

  async listStoreReviews(storeId: string, currentUserId?: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsRepo.find({
      where: { storeId, productId: IsNull(), status: 'published' },
      relations: ['user', 'user.customerProfile'],
      order: { createdAt: 'DESC' },
    });
    return reviews.map((review) => this.mapReview(review, currentUserId));
  }

  async getUserReview(storeId: string, userId: string): Promise<ReviewResponseDto | null> {
    const review = await this.reviewsRepo.findOne({
      where: { storeId, productId: IsNull(), userId, deletedAt: null as any },
      relations: ['user', 'user.customerProfile'],
    });
    return review ? this.mapReview(review, userId) : null;
  }

  async deleteReview(
    storeId: string,
    reviewId: string,
    userId: string,
    role: string,
    hasCustomerProfile = false,
  ): Promise<{ success: true }> {
    if (role !== 'customer' && !hasCustomerProfile) {
      throw new ForbiddenException('Only customers can delete reviews');
    }
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId, storeId, productId: IsNull() } });
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
      .andWhere('review.productId IS NULL')
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
      .innerJoin('tag.reviews', 'review', 'review.storeId = :storeId AND review.status = :status AND review.productId IS NULL', {
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

  async getStoreReviewSummaries(storeIds: string[]): Promise<ReviewSummaryDto[]> {
    const ids = Array.from(
      new Set(
        storeIds.filter((id) => typeof id === 'string' && id.trim().length > 0 && isUuid(id)),
      ),
    );
    if (!ids.length) {
      return [];
    }

    const ratingRows = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('review.storeId', 'storeId')
      .addSelect('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.storeId IN (:...storeIds)', { storeIds: ids })
      .andWhere('review.status = :status', { status: 'published' })
      .andWhere('review.productId IS NULL')
      .groupBy('review.storeId')
      .addGroupBy('review.rating')
      .getRawMany<{ storeId: string; rating: number; count: string }>();

    const tagRows = await this.tagsRepo
      .createQueryBuilder('tag')
      .select('review.storeId', 'storeId')
      .addSelect('tag.key', 'key')
      .addSelect('tag.label', 'label')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('tag.reviews', 'review', 'review.storeId IN (:...storeIds) AND review.status = :status AND review.productId IS NULL', {
        storeIds: ids,
        status: 'published',
      })
      .groupBy('review.storeId')
      .addGroupBy('tag.key')
      .addGroupBy('tag.label')
      .orderBy('count', 'DESC')
      .getRawMany<{ storeId: string; key: string; label: string; count: string }>();

    const summaries = new Map<string, ReviewSummaryDto>();
    ids.forEach((id) => {
      summaries.set(id, {
        storeId: id,
        averageRating: 0,
        total: 0,
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topTags: [],
      });
    });

    ratingRows.forEach((row) => {
      const summary = summaries.get(row.storeId);
      if (!summary) return;
      const rating = Number(row.rating);
      const count = Number(row.count) || 0;
      if (rating >= 1 && rating <= 5) {
        summary.counts[rating] = count;
      }
    });

    summaries.forEach((summary) => {
      const total = Object.values(summary.counts).reduce((sum, value) => sum + value, 0);
      summary.total = total;
      summary.averageRating =
        total === 0
          ? 0
          : Object.entries(summary.counts).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0) / total;
    });

    const tagsByStore = new Map<string, { key: string; label: string; count: number }[]>();
    tagRows.forEach((row) => {
      const list = tagsByStore.get(row.storeId) ?? [];
      list.push({
        key: row.key,
        label: row.label,
        count: Number(row.count) || 0,
      });
      tagsByStore.set(row.storeId, list);
    });

    tagsByStore.forEach((tags, storeId) => {
      const summary = summaries.get(storeId);
      if (!summary) return;
      summary.topTags = tags.sort((a, b) => b.count - a.count).slice(0, 5);
    });

    return Array.from(summaries.values());
  }

  async createProductReview(
    productId: string,
    userId: string,
    role: string,
    dto: CreateReviewDto,
    hasCustomerProfile = false,
  ): Promise<ReviewResponseDto> {
    if (role !== 'customer' && !hasCustomerProfile) {
      throw new ForbiddenException('Only customers can submit reviews');
    }
    const product = await this.productsRepo.findOne({ where: { id: productId, deletedAt: null as any } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const hasCriteriaRatings = dto.criteriaRatings !== undefined;
    const criteriaRatings = hasCriteriaRatings
      ? this.sanitizeCriteriaRatings(dto.criteriaRatings, PRODUCT_REVIEW_CRITERIA)
      : null;
    const existing = await this.reviewsRepo.findOne({
      where: { productId, userId, deletedAt: null as any },
    });
    if (existing) {
      existing.rating = dto.rating;
      existing.comment = dto.comment ?? null;
      if (hasCriteriaRatings) {
        existing.criteriaRatings = criteriaRatings;
      }
      existing.status = 'published';
      const saved = await this.reviewsRepo.save(existing);
      const withUser = await this.loadReviewWithUser(saved.id);
      return this.mapReview(withUser ?? saved, userId);
    }

    const review = this.reviewsRepo.create({
      storeId: product.storeId,
      productId,
      userId,
      rating: dto.rating,
      comment: dto.comment ?? null,
      criteriaRatings: hasCriteriaRatings ? criteriaRatings : null,
      status: 'published',
      tags: [], // product reviews do not use tags (yet)
    });
    const saved = await this.reviewsRepo.save(review);
    const withUser = await this.loadReviewWithUser(saved.id);
    return this.mapReview(withUser ?? saved, userId);
  }

  async listProductReviews(productId: string, currentUserId?: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsRepo.find({
      where: { productId, status: 'published' },
      relations: ['user', 'user.customerProfile'],
      order: { createdAt: 'DESC' },
    });
    return reviews.map((review) => this.mapReview(review, currentUserId));
  }

  async getUserProductReview(productId: string, userId: string): Promise<ReviewResponseDto | null> {
    const review = await this.reviewsRepo.findOne({
      where: { productId, userId, deletedAt: null as any },
      relations: ['user', 'user.customerProfile'],
    });
    return review ? this.mapReview(review, userId) : null;
  }

  async deleteProductReview(
    productId: string,
    reviewId: string,
    userId: string,
    role: string,
    hasCustomerProfile = false,
  ): Promise<{ success: true }> {
    if (role !== 'customer' && !hasCustomerProfile) {
      throw new ForbiddenException('Only customers can delete reviews');
    }
    const review = await this.reviewsRepo.findOne({ where: { id: reviewId, productId } });
    if (!review || review.deletedAt) {
      return { success: true };
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }
    await this.reviewsRepo.softRemove(review);
    return { success: true };
  }

  async getProductReviewSummary(productId: string): Promise<ReviewSummaryDto> {
    const rows = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId', { productId })
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

    return {
      productId,
      averageRating,
      total,
      counts,
      topTags: [],
    };
  }

  async getProductReviewSummaries(productIds: string[]): Promise<ReviewSummaryDto[]> {
    const ids = Array.from(
      new Set(
        productIds.filter((id) => typeof id === 'string' && id.trim().length > 0 && isUuid(id)),
      ),
    );
    if (!ids.length) {
      return [];
    }

    const ratingRows = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('review.productId', 'productId')
      .addSelect('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId IN (:...productIds)', { productIds: ids })
      .andWhere('review.status = :status', { status: 'published' })
      .groupBy('review.productId')
      .addGroupBy('review.rating')
      .getRawMany<{ productId: string; rating: number; count: string }>();

    const summaries = new Map<string, ReviewSummaryDto>();
    ids.forEach((id) => {
      summaries.set(id, {
        productId: id,
        averageRating: 0,
        total: 0,
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topTags: [],
      });
    });

    ratingRows.forEach((row) => {
      const summary = summaries.get(row.productId);
      if (!summary) return;
      const rating = Number(row.rating);
      const count = Number(row.count) || 0;
      if (rating >= 1 && rating <= 5) {
        summary.counts[rating] = count;
      }
    });

    summaries.forEach((summary) => {
      const total = Object.values(summary.counts).reduce((sum, value) => sum + value, 0);
      summary.total = total;
      summary.averageRating =
        total === 0
          ? 0
          : Object.entries(summary.counts).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0) / total;
    });

    return Array.from(summaries.values());
  }

  private sanitizeCriteriaRatings(
    input: Record<string, number> | undefined,
    allowedKeys: readonly string[],
  ): Record<string, number> | null {
    if (!input || typeof input !== 'object') {
      return null;
    }
    const entries = Object.entries(input).filter(
      ([key, value]) => allowedKeys.includes(key) && Number.isInteger(value) && value >= 1 && value <= 3,
    );
    if (!entries.length) {
      return null;
    }
    return entries.reduce<Record<string, number>>((acc, [key, value]) => {
      acc[key] = Number(value);
      return acc;
    }, {});
  }

  private async loadReviewWithUser(id: string): Promise<Review | undefined> {
    const review = await this.reviewsRepo.findOne({
      where: { id },
      relations: ['user', 'user.customerProfile', 'tags'],
    });
    return review ?? undefined;
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
      storeId: review.storeId,
      productId: review.productId ?? null,
      rating: review.rating,
      criteriaRatings: review.criteriaRatings ?? null,
      comment: review.comment ?? null,
      tags,
      username,
      createdAt: review.createdAt.toISOString(),
      canDelete: currentUserId ? review.userId === currentUserId : false,
    };
  }
}
