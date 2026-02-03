import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetLegalHoldDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
