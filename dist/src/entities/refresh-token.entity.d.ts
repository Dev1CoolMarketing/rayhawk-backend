import { User } from './user.entity';
export declare class RefreshToken {
    id: string;
    user: User;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
}
