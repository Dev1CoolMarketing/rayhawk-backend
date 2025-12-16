import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export enum AnalyticsEventType {
  PageView = 'page_view',
  ClickThrough = 'click_through',
  ProductView = 'product_view',
  ProductClick = 'product_click',
  Search = 'search',
  FavoriteAdd = 'favorite_add',
  FavoriteRemove = 'favorite_remove',
  ReviewSubmit = 'review_submit',
}

export class CreateAnalyticsEventDto {
  @IsEnum(AnalyticsEventType)
  type!: AnalyticsEventType;

  @IsString()
  @MinLength(1)
  storeId!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  userAgent?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
