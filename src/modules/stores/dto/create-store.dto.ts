import { IsArray, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

const US_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
] as const;

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  openingHours?: string[];

  @IsObject()
  @IsOptional()
  openingHoursWeekly?: Record<string, { start: number; end: number }[]>;

  @IsString()
  @IsOptional()
  @IsIn(US_TIMEZONES)
  timezone?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
