import { IsString, MinLength } from 'class-validator';

export class UpdateVendorPlanDto {
  @IsString()
  @MinLength(2)
  planKey!: string;
}
