import { IsString, IsUrl, MinLength } from 'class-validator';

export class LinkImageDto {
  @IsUrl()
  url!: string;

  @IsString()
  @MinLength(3)
  publicId!: string;
}
