import { UserRole } from './auth.types';

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  hasCustomerProfile?: boolean;
}
