import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { HormoneFormFactor } from '../../../entities/hormone-log.entity';

export class CreateHormoneLogDto {
  @IsNumber()
  @IsNotEmpty()
  testosteroneLevel!: number;

  @IsNumber()
  @IsNotEmpty()
  estradiolLevel!: number;

  @IsNumber()
  @IsNotEmpty()
  doseMg!: number;

  @IsIn(['injection', 'gel', 'cream', 'oral', 'patch', 'pellet', 'nasal', 'other'])
  formFactor!: HormoneFormFactor;

  @IsOptional()
  @IsDateString()
  dateTaken?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  moodScore!: number;

  @IsOptional()
  @IsString()
  moodNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  erectionStrength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  morningErections?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  libido?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sexualThoughts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  energyLevels?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  moodStability?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  strengthEndurance?: number;
}
