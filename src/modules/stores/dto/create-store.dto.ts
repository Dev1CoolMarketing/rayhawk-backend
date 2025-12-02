import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  openingHours?: string[];
}
