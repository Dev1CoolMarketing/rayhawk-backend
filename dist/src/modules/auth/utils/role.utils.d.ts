import { User } from '../../../entities';
import { UserRole } from '../types/auth.types';
export declare function getAssignableRoles(user: User): Set<UserRole>;
