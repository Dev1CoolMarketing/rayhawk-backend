import { User } from '../../../entities';
import { UserRole } from '../types/auth.types';

export function getAssignableRoles(user: User): Set<UserRole> {
  const roles = new Set<UserRole>([user.role]);
  if (user.customerProfile) {
    roles.add('customer');
  }
  return roles;
}
