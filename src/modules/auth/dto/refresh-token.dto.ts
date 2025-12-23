import { RefreshTokenRequest, AuthAudience } from '../types/auth.types';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto implements RefreshTokenRequest {
  @IsString()
  @MinLength(10)
  refreshToken!: string;

  @IsOptional()
  @IsIn(['vendor', 'customer'])
  role?: AuthAudience;
}
