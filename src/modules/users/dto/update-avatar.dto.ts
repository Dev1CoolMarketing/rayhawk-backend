import { IsString, MinLength } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @MinLength(10)
  file!: string; // base64 data URL
}
