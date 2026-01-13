import { IsIn } from 'class-validator';
import { VENDOR_PLAN_KEYS, type VendorPlanKey } from '../constants/vendor-plans';

export class SchedulePlanChangeDto {
  @IsIn(VENDOR_PLAN_KEYS)
  planKey!: VendorPlanKey;
}
