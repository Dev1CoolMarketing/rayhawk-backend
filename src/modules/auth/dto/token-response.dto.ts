import { AuthTokens, AuthUser, TokenResponse } from '../types/auth.types';

export class AuthUserDto implements AuthUser {
  id!: string;
  email!: string;
  role!: 'admin' | 'user' | 'vendor' | 'customer';
  firstName?: string | null;
  lastName?: string | null;
  createdAt!: string;
  updatedAt!: string;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorDescription?: string | null;
  customerProfile?: { username: string; birthYear: number } | null;
}

export class TokenResponseDto implements TokenResponse {
  accessToken!: string;
  accessTokenExpiresIn!: number;
  refreshToken!: string;
  refreshTokenExpiresIn!: number;
  user!: AuthUserDto;
}
