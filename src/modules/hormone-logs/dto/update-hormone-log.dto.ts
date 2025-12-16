import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { HormoneFormFactor } from '../../../entities';

export class UpdateHormoneLogDto {
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
  formFactor?: HormoneFormFactor;

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
}
