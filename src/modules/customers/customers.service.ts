import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CustomerProfile, FavoriteStore, Store } from '../../entities';
import type { VitalityTrackingPreferences } from '../../entities/customer-profile.entity';
import { generateUsername } from './username-generator';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerProfile) private readonly profilesRepo: Repository<CustomerProfile>,
    @InjectRepository(FavoriteStore) private readonly favoritesRepo: Repository<FavoriteStore>,
    @InjectRepository(Store) private readonly storesRepo: Repository<Store>,
  ) {}

  async createProfile(userId: string, birthYear: number) {
    const username = await this.generateUniqueUsername();
    const profile = this.profilesRepo.create({ userId, birthYear, username });
    return this.profilesRepo.save(profile);
  }

  async upsertProfile(userId: string, birthYear: number) {
    const existing = await this.profilesRepo.findOne({ where: { userId } });
    if (existing) {
      existing.birthYear = birthYear;
      return this.profilesRepo.save(existing);
    }
    return this.createProfile(userId, birthYear);
  }

  async hasProfile(userId: string) {
    const count = await this.profilesRepo.count({ where: { userId } });
    return count > 0;
  }

  async findProfile(userId: string) {
    return this.profilesRepo.findOne({ where: { userId } });
  }

  async requireProfile(userId: string) {
    const profile = await this.findProfile(userId);
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }
    return profile;
  }

  async updateVitalityPreferences(userId: string, preferences: VitalityTrackingPreferences) {
    const profile = await this.requireProfile(userId);
    profile.vitalityPreferences = {
      ...(profile.vitalityPreferences ?? {}),
      ...preferences,
    };
    return this.profilesRepo.save(profile);
  }

  async listFavoriteStores(userId: string) {
    const favorites = await this.favoritesRepo.find({
      where: { userId },
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
    return favorites
      .map((favorite) => favorite.store)
      .filter(Boolean)
      .map((store) => this.mapStore(store!));
  }

  async addFavorite(userId: string, storeId: string) {
    const store = await this.storesRepo.findOne({ where: { id: storeId, deletedAt: IsNull() } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const favorite = this.favoritesRepo.create({ userId, storeId });
    try {
      await this.favoritesRepo.insert(favorite);
    } catch {
      // ignore duplicate favorites
    }
    return this.listFavoriteStores(userId);
  }

  async removeFavorite(userId: string, storeId: string) {
    await this.favoritesRepo.delete({ userId, storeId });
    return this.listFavoriteStores(userId);
  }

  private async generateUniqueUsername(attempt = 0): Promise<string> {
    const username = generateUsername();
    const existing = await this.profilesRepo.findOne({ where: { username } });
    if (!existing) {
      return username;
    }
    if (attempt > 5) {
      return `${username}-${Date.now()}`;
    }
    return this.generateUniqueUsername(attempt + 1);
  }

  private mapStore(store: Store) {
    return {
      id: store.id,
      name: store.name,
      city: store.city,
      state: store.state,
      status: store.status,
      slug: store.slug,
      imageUrl: store.imageUrl ?? null,
    };
  }
}
