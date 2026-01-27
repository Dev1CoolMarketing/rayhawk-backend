import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AnalyticsGroupBy {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsEnum(AnalyticsGroupBy)
  group?: AnalyticsGroupBy;
}
