import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateStoreQuantityDto {
  @IsInt()
  @Min(0)
  @Max(500)
  quantity!: number;

  @IsOptional()
  @IsString()
  priceId?: string;
}
