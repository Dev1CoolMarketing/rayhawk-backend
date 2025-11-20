import { IsString, MinLength } from 'class-validator';

export class UploadImageDto {
  @IsString()
  @MinLength(10)
  file!: string; // Base64 data URL
}
