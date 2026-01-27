import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateHormoneLogDto {
  @IsOptional()
  @IsIn(['monthly', 'vitality'])
  logType?: 'monthly' | 'vitality';

  @IsOptional()
  @IsNumber()
  testosteroneLevel?: number;

  @IsOptional()
  @IsNumber()
  estradiolLevel?: number;

  @IsOptional()
  @IsNumber()
  doseMg?: number;

  @IsOptional()
  @IsIn(['injection', 'gel', 'cream', 'oral', 'patch', 'pellet', 'nasal', 'other'])
  formFactor?: string;

  @IsOptional()
  @IsDateString()
  dateTaken?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  moodScore?: number;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  concentrationSharpness?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  bodyComposition?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sleepQuality?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  exerciseDurationMinutes?: number;

  @IsOptional()
  @IsString()
  exerciseIntensity?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sleepHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  stressLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightLbs?: number;
}
