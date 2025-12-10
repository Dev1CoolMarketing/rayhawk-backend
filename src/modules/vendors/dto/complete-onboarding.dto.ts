import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { VendorPlanKey, VENDOR_PLAN_KEYS } from '../../billing/constants/vendor-plans';

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

  @IsOptional()
  @IsIn(VENDOR_PLAN_KEYS)
  planKey?: VendorPlanKey;

  @IsString()
  @IsOptional()
  vendorImageUrl?: string;

  @IsString()
  @IsOptional()
  vendorImagePublicId?: string;
}
