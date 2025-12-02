import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class SeatsCheckoutDto {
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(500)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxPriceCents?: number;
}
