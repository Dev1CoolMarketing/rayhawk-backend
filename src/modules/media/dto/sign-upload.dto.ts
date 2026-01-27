import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SignUploadDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsInt()
  @Min(1024)
  @Max(50 * 1024 * 1024)
  maxBytes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFormats?: string[];
}
