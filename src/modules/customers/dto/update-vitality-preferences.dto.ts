import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVitalityPreferencesDto {
  @IsOptional()
  @IsBoolean()
  includeTestosterone?: boolean;

  @IsOptional()
  @IsBoolean()
  includeExercise?: boolean;

  @IsOptional()
  @IsBoolean()
  includeSleep?: boolean;

  @IsOptional()
  @IsBoolean()
  includeStress?: boolean;

  @IsOptional()
  @IsBoolean()
  includeWeight?: boolean;
}
