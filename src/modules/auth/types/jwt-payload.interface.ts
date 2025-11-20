import { UserRole } from './auth.types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tv: number;
}

export interface RefreshJwtPayload {
  sub: string;
  tv: number;
  type: 'refresh';
  role: UserRole;
}
