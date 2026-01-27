import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateVendorProfileDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  description?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  phoneNumber?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  vendorImageUrl?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  vendorImagePublicId?: string | null;
}
