import { IsIn } from 'class-validator';
import { VendorPlanKey, VENDOR_PLAN_KEYS } from '../../billing/constants/vendor-plans';

export class UpdatePlanDto {
  @IsIn(VENDOR_PLAN_KEYS)
  planKey!: VendorPlanKey;
}
