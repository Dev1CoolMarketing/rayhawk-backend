import { UserRole } from '../modules/auth/types/auth.types';
import { RefreshToken } from './refresh-token.entity';
import { CustomerProfile } from './customer-profile.entity';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    avatarPublicId?: string | null;
    role: UserRole;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
    refreshTokens?: RefreshToken[];
    customerProfile?: CustomerProfile;
}
