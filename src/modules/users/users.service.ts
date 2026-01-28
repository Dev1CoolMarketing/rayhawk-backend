import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CustomerProfile, FavoriteStore, HormoneLog, Review, Store, User } from '../../entities';
import { UserRole } from '../auth/types/auth.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(CustomerProfile) private readonly profilesRepo: Repository<CustomerProfile>,
    @InjectRepository(HormoneLog) private readonly hormoneLogsRepo: Repository<HormoneLog>,
    @InjectRepository(FavoriteStore) private readonly favoritesRepo: Repository<FavoriteStore>,
    @InjectRepository(Store) private readonly storesRepo: Repository<Store>,
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
  ) {}

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

  async createFromSupabase(data: {
    email: string;
    role?: UserRole;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<User> {
    const passwordHash = await hash(randomUUID(), 12);
    const user = this.usersRepo.create({
      email: data.email,
      passwordHash,
      role: data.role ?? 'user',
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
    });
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

  async updatePassword(userId: string, passwordHash: string, tokenVersion?: number): Promise<void> {
    const updatePayload: Partial<User> = { passwordHash };
    if (typeof tokenVersion === 'number') {
      updatePayload.tokenVersion = tokenVersion;
    }
    await this.usersRepo.update({ id: userId }, updatePayload);
  }

  async deleteById(id: string): Promise<void> {
    await this.usersRepo.delete({ id });
  }

  async setLegalHold(userId: string, enabled: boolean, reason?: string | null): Promise<User> {
    const updatePayload: Partial<User> = {
      legalHold: enabled,
      legalHoldReason: enabled ? (reason?.trim() || null) : null,
      legalHoldSetAt: enabled ? new Date() : null,
    };
    await this.usersRepo.update({ id: userId }, updatePayload);
    const updated = await this.findById(userId);
    if (!updated) {
      throw new Error('User not found after legal hold update');
    }
    return updated;
  }

  async exportUserData(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = await this.profilesRepo.findOne({ where: { userId } });
    const hormoneLogs = await this.hormoneLogsRepo.find({
      where: { customerProfileId: userId },
      order: { dateTaken: 'DESC', createdAt: 'DESC' },
    });
    const favorites = await this.favoritesRepo.find({
      where: { userId },
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
    const reviews = await this.reviewsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      generatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile
        ? {
            userId: profile.userId,
            username: profile.username,
            birthYear: profile.birthYear,
            vitalityPreferences: profile.vitalityPreferences ?? {},
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      hormoneLogs: hormoneLogs.map((log) => ({
        id: log.id,
        logType: log.logType,
        dateTaken: log.dateTaken,
        testosteroneNgDl: log.testosteroneNgDl ?? null,
        estradiolPgMl: log.estradiolPgMl ?? null,
        doseMg: log.doseMg ?? null,
        formFactor: log.formFactor ?? null,
        moodScore: log.moodScore ?? null,
        moodNotes: log.moodNotes ?? null,
        erectionStrength: log.erectionStrength ?? null,
        morningErections: log.morningErections ?? null,
        libido: log.libido ?? null,
        sexualThoughts: log.sexualThoughts ?? null,
        energyLevels: log.energyLevels ?? null,
        moodStability: log.moodStability ?? null,
        strengthEndurance: log.strengthEndurance ?? null,
        concentrationSharpness: log.concentrationSharpness ?? null,
        bodyComposition: log.bodyComposition ?? null,
        sleepQuality: log.sleepQuality ?? null,
        exerciseDurationMinutes: log.exerciseDurationMinutes ?? null,
        exerciseIntensity: log.exerciseIntensity ?? null,
        sleepHours: log.sleepHours ?? null,
        stressLevel: log.stressLevel ?? null,
        weightLbs: log.weightLbs ?? null,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      })),
      favorites: favorites.map((favorite) => ({
        storeId: favorite.storeId,
        createdAt: favorite.createdAt,
        store: favorite.store
          ? {
              id: favorite.store.id,
              name: favorite.store.name,
              city: favorite.store.city,
              state: favorite.store.state,
            }
          : null,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        storeId: review.storeId,
        productId: review.productId ?? null,
        rating: review.rating,
        criteriaRatings: review.criteriaRatings ?? null,
        comment: review.comment ?? null,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        deletedAt: review.deletedAt ?? null,
      })),
    };
  }
}
