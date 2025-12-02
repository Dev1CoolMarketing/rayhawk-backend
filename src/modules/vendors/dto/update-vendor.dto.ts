import { IsOptional, IsString } from 'class-validator';

export class UpdateVendorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
