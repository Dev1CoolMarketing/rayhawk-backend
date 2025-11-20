import { RefreshTokenRequest } from '../types/auth.types';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto implements RefreshTokenRequest {
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
