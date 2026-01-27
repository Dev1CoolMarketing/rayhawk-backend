import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent, Product, Store } from '../../entities';
import { CreateAnalyticsEventDto, AnalyticsEventType } from './dto/create-analytics-event.dto';
import { AnalyticsGroupBy } from './dto/analytics-query.dto';

type SeriesPoint = {
  period: string;
  pageViews: number;
  clickThroughs: number;
  productViews: number;
};

type Summary = {
  storeId: string;
  from: string;
  to: string;
  group: AnalyticsGroupBy;
  totals: {
    pageViews: number;
    clickThroughs: number;
    productViews: number;
  };
  series: SeriesPoint[];
};

export type ProductBreakdown = {
  productId: string;
  productName: string | null;
  productViews: number;
  clickThroughs: number;
  clickThroughRate: number;
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent) private readonly eventsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(Store) private readonly storesRepo: Repository<Store>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
  ) {}

  async recordEvent(dto: CreateAnalyticsEventDto, ipHash?: string | null) {
    this.logger.log(
      `Record analytics event type=${dto.type} storeId=${dto.storeId} productId=${dto.productId ?? 'none'}`,
    );
    const store = await this.storesRepo.findOne({ where: { id: dto.storeId } });
    if (!store) {
      this.logger.warn(`Analytics event rejected: store not found. storeId=${dto.storeId}`);
      throw new NotFoundException('Store not found');
    }

    const event = this.eventsRepo.create({
      storeId: dto.storeId,
      vendorId: store.vendorId,
      productId: dto.productId ?? null,
      type: dto.type,
      referrer: dto.referrer ?? null,
      sessionId: dto.sessionId ?? null,
      userAgent: dto.userAgent ?? null,
      ipHash: ipHash ?? null,
      metadata: dto.metadata ?? null,
    });
    return this.eventsRepo.save(event);
  }

  async getStoreSummary(params: {
    storeId: string;
    ownerId: string;
    from?: Date;
    to?: Date;
    group?: AnalyticsGroupBy;
  }): Promise<Summary> {
    const store = await this.storesRepo.findOne({ where: { id: params.storeId }, relations: ['vendor'] });
    if (!store) {
      this.logger.warn(`Store not found for analytics summary. storeId=${params.storeId}, ownerId=${params.ownerId}`);
      throw new NotFoundException('Store not found');
    }
    if (!store.vendor || store.vendor.ownerId !== params.ownerId) {
      this.logger.warn(
        `Store ownership mismatch for analytics summary. storeId=${params.storeId}, ownerId=${params.ownerId}, storeVendorOwnerId=${store.vendor?.ownerId ?? 'none'}`,
      );
      throw new ForbiddenException('You do not own this store');
    }

    const from = params.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = params.to ?? new Date();
    const group = params.group ?? AnalyticsGroupBy.Day;

    const totals = await this.eventsRepo
      .createQueryBuilder('event')
      .select(`SUM(CASE WHEN event.type = :pv THEN 1 ELSE 0 END)`, 'pageViews')
      .addSelect(
        `SUM(CASE WHEN event.type IN (:...ctTypes) THEN 1 ELSE 0 END)`,
        'clickThroughs',
      )
      .addSelect(`SUM(CASE WHEN event.type = :prd THEN 1 ELSE 0 END)`, 'productViews')
      .where('event.storeId = :storeId', { storeId: params.storeId })
      .andWhere('event.occurredAt BETWEEN :from AND :to', { from, to })
      .setParameters({
        pv: AnalyticsEventType.PageView,
        ctTypes: [AnalyticsEventType.ClickThrough, AnalyticsEventType.ProductClick],
        prd: AnalyticsEventType.ProductView,
      })
      .getRawOne();

    const seriesRaw = await this.eventsRepo
      .createQueryBuilder('event')
      .select(`date_trunc(:bucket, event.occurredAt)`, 'period')
      .addSelect(`SUM(CASE WHEN event.type = :pv THEN 1 ELSE 0 END)`, 'pageViews')
      .addSelect(
        `SUM(CASE WHEN event.type IN (:...ctTypes) THEN 1 ELSE 0 END)`,
        'clickThroughs',
      )
      .addSelect(`SUM(CASE WHEN event.type = :prd THEN 1 ELSE 0 END)`, 'productViews')
      .where('event.storeId = :storeId', { storeId: params.storeId })
      .andWhere('event.occurredAt BETWEEN :from AND :to', { from, to })
      .setParameters({
        pv: AnalyticsEventType.PageView,
        ctTypes: [AnalyticsEventType.ClickThrough, AnalyticsEventType.ProductClick],
        prd: AnalyticsEventType.ProductView,
        bucket: group,
      })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<{ period: Date; pageViews: string; clickThroughs: string; productViews: string }>();

    const series: SeriesPoint[] = seriesRaw.map((row) => ({
      period: row.period.toISOString(),
      pageViews: Number(row.pageViews) || 0,
      clickThroughs: Number(row.clickThroughs) || 0,
      productViews: Number(row.productViews) || 0,
    }));

    return {
      storeId: params.storeId,
      from: from.toISOString(),
      to: to.toISOString(),
      group,
      totals: {
        pageViews: Number(totals?.pageViews) || 0,
        clickThroughs: Number(totals?.clickThroughs) || 0,
        productViews: Number(totals?.productViews) || 0,
      },
      series,
    };
  }

  async getProductBreakdown(params: {
    storeId: string;
    ownerId: string;
    from?: Date;
    to?: Date;
  }): Promise<ProductBreakdown[]> {
    const store = await this.storesRepo.findOne({ where: { id: params.storeId }, relations: ['vendor'] });
    if (!store) {
      this.logger.warn(`Store not found for analytics products. storeId=${params.storeId}, ownerId=${params.ownerId}`);
      throw new NotFoundException('Store not found');
    }
    if (!store.vendor || store.vendor.ownerId !== params.ownerId) {
      this.logger.warn(
        `Store ownership mismatch for analytics products. storeId=${params.storeId}, ownerId=${params.ownerId}, storeVendorOwnerId=${store.vendor?.ownerId ?? 'none'}`,
      );
      throw new ForbiddenException('You do not own this store');
    }

    const from = params.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = params.to ?? new Date();

    const rows = await this.eventsRepo
      .createQueryBuilder('event')
      .select('event.productId', 'productId')
      .addSelect(`SUM(CASE WHEN event.type = :prd THEN 1 ELSE 0 END)`, 'productViews')
      .addSelect(`SUM(CASE WHEN event.type IN (:...ctTypes) THEN 1 ELSE 0 END)`, 'clickThroughs')
      .where('event.storeId = :storeId', { storeId: params.storeId })
      .andWhere('event.productId IS NOT NULL')
      .andWhere('event.occurredAt BETWEEN :from AND :to', { from, to })
      .setParameters({
        prd: AnalyticsEventType.ProductView,
        ctTypes: [AnalyticsEventType.ClickThrough, AnalyticsEventType.ProductClick],
      })
      .groupBy('event.productId')
      .orderBy('productViews', 'DESC')
      .getRawMany<{ productId: string; productViews: string; clickThroughs: string }>();

    const productIds = rows.map((r) => r.productId).filter(Boolean);
    const products = productIds.length
      ? await this.productsRepo
          .createQueryBuilder('product')
          .where('product.id IN (:...ids)', { ids: productIds })
          .andWhere('product.deleted_at IS NULL')
          .getMany()
      : [];
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    return rows.map((row) => ({
      productId: row.productId,
      productName: nameById.get(row.productId) ?? null,
      productViews: Number(row.productViews) || 0,
      clickThroughs: Number(row.clickThroughs) || 0,
      clickThroughRate:
        (Number(row.productViews) || 0) > 0
          ? (Number(row.clickThroughs) || 0) / Math.max(Number(row.productViews) || 0, 1)
          : 0,
    }));
  }
}
