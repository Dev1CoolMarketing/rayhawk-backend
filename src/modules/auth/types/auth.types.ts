export type UserRole = 'admin' | 'user' | 'vendor' | 'customer';
export type AuthAudience = Extract<UserRole, 'vendor' | 'customer'>;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  updatedAt: string;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorDescription?: string | null;
  customerProfile?: {
    username: string;
    birthYear: number;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

export interface TokenResponse extends AuthTokens {
  user: AuthUser;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
}

export interface LoginRequest extends RegisterUserRequest {
  audience?: AuthAudience;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
