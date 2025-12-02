import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class UpdateStoreQuantityDto {
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(500)
  quantity!: number;

  @IsOptional()
  @IsString()
  priceId?: string;
}
