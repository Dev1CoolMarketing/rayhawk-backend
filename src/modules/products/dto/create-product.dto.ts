import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

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

  @ApiProperty({ example: 'inactive', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'https://drvigor.com/store/irvine/products/prophy', required: false })
  @IsString()
  @IsOptional()
  linkUrl?: string;
}
