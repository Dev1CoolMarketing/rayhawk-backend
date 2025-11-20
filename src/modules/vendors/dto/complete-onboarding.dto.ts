import { IsOptional, IsString, MinLength } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsString()
  @MinLength(2)
  vendorName!: string;

  @IsString()
  @IsOptional()
  vendorDescription?: string;
}
