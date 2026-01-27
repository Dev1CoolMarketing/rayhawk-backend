import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Featured Listing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'Boosts visibility for 30 days', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 4999, description: 'Price in cents' })
  @IsInt()
  @IsPositive()
  priceCents!: number;

  @ApiProperty({ example: ['Disposable tips', 'Mint flavor'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bulletPoints?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiProperty({ example: 60, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  unitCount?: number;

  @ApiProperty({ example: 'capsule', required: false })
  @IsString()
  @IsOptional()
  unitCountType?: string;

  @ApiProperty({ example: 'capsule', required: false })
  @IsString()
  @IsOptional()
  formFactor?: string;

  @ApiProperty({ example: 'one_time', required: false })
  @IsString()
  @IsIn(['one_time', 'recurring'])
  @IsOptional()
  billingType?: 'one_time' | 'recurring';

  @ApiProperty({ example: 'month', required: false })
  @IsString()
  @IsIn(['month', 'year'])
  @IsOptional()
  billingInterval?: 'month' | 'year';

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  billingQuantity?: number;

  @ApiProperty({ example: 'inactive', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: ['oral-care'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ example: 'https://drvigor.com/store/irvine/products/prophy', required: false })
  @IsString()
  @IsOptional()
  linkUrl?: string;
}
