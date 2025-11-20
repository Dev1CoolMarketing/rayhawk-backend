import { CustomerProfile, User, Vendor } from '../../entities';
import { AuthUserDto } from './dto/token-response.dto';
import { UserRole } from './types/auth.types';

export const mapUserToAuthUserDto = (
  user: User,
  vendor?: Vendor | null,
  profile?: CustomerProfile | null,
  roleOverride?: UserRole,
): AuthUserDto => ({
  id: user.id,
  email: user.email,
  role: roleOverride ?? user.role,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  vendorId: vendor?.id ?? null,
  vendorName: vendor?.name ?? null,
  vendorDescription: vendor?.description ?? null,
  customerProfile: profile
    ? {
        username: profile.username,
        birthYear: profile.birthYear,
      }
    : null,
});
