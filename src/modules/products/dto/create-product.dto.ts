import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsPositive,
  MaxLength,
} from 'class-validator';

export const UNIT_COUNT_TYPES = [
  'item',
  'box',
  'bottle',
  'capsule',
  'tablet',
  'packet',
  'scoop',
  'ml',
  'oz',
  'l',
  'kg',
  'g',
  'dose',
  'service',
  'session',
  'month',
  'year',
] as const;

export const FORM_FACTORS = [
  'capsule',
  'tablet',
  'liquid',
  'powder',
  'pellet',
  'device',
  'kit',
  'digital',
  'service',
] as const;

export const BILLING_TYPES = ['one_time', 'recurring'] as const;
export const BILLING_INTERVALS = ['month', 'year'] as const;

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Featured Listing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'premium-featured-listing', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ example: 'Boosts visibility for 30 days', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 4999, description: 'Price in cents' })
  @IsInt()
  @IsPositive()
  priceCents!: number;

  @ApiProperty({ example: 'inactive', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'https://drvigor.com/store/irvine/products/prophy', required: false })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiProperty({
    example: ['Free shipping over $50', 'Ships within 2 business days'],
    required: false,
    isArray: true,
    type: String,
    description: 'Bullet points shown under the description.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bulletPoints?: string[];

  @ApiProperty({
    example: 60,
    required: false,
    description: 'Number of units in the product (e.g., capsules, ml, sessions).',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  unitCount?: number;

  @ApiProperty({
    example: 'capsule',
    required: false,
    enum: UNIT_COUNT_TYPES,
    description: 'Unit type describing the unitCount.',
  })
  @IsString()
  @IsOptional()
  @IsIn(UNIT_COUNT_TYPES as readonly string[])
  unitCountType?: string;

  @ApiProperty({
    example: 'capsule',
    required: false,
    enum: FORM_FACTORS,
    description: 'Form factor of the product (e.g., capsule, device, service).',
  })
  @IsString()
  @IsOptional()
  @IsIn(FORM_FACTORS as readonly string[])
  formFactor?: string;

  @ApiProperty({
    example: 'recurring',
    required: false,
    enum: BILLING_TYPES,
    description: 'Whether the item is a one-time purchase or recurring.',
  })
  @IsString()
  @IsOptional()
  @IsIn(BILLING_TYPES as readonly string[])
  billingType?: string;

  @ApiProperty({
    example: 'month',
    required: false,
    enum: BILLING_INTERVALS,
    description: 'Billing interval for recurring items.',
  })
  @IsString()
  @IsOptional()
  @IsIn(BILLING_INTERVALS as readonly string[])
  billingInterval?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Number of intervals per billing (e.g., 3 months for quarterly plans).',
    default: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  billingQuantity?: number;

  @ApiProperty({
    example: ['injections', 'transdermal'],
    required: false,
    isArray: true,
    type: String,
    description: 'Category keys; must match an existing product category.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({
    example: false,
    required: false,
    description: 'Flag to elevate this product in featured placements.',
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
