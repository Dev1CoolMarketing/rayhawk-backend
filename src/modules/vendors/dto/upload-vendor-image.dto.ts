import { IsString, MinLength } from 'class-validator';

export class UploadVendorImageDto {
  @IsString()
  @MinLength(10)
  file!: string;
}
