import { Repository } from 'typeorm';
import { User } from '../../entities';
export declare class UsersService {
    private readonly usersRepo;
    constructor(usersRepo: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(email: string, passwordHash: string, role?: User['role']): Promise<User>;
    incrementTokenVersion(userId: string): Promise<void>;
    updateProfile(id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'role' | 'avatarUrl' | 'avatarPublicId'>>): Promise<User>;
    deleteById(id: string): Promise<void>;
}
