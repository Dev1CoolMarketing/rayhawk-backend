import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email }, relations: ['customerProfile'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id }, relations: ['customerProfile'] });
  }

  async create(email: string, passwordHash: string, role: User['role'] = 'user'): Promise<User> {
    const user = this.usersRepo.create({ email, passwordHash, role });
    return this.usersRepo.save(user);
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.usersRepo.increment({ id: userId }, 'tokenVersion', 1);
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'role' | 'avatarUrl' | 'avatarPublicId'>>,
  ): Promise<User> {
    await this.usersRepo.update({ id }, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('User not found after update');
    }
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    await this.usersRepo.delete({ id });
  }
}
