import { IsArray, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsObject()
  @IsOptional()
  criteriaRatings?: Record<string, number>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
