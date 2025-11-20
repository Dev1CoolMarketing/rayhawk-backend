import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteStore, Store } from '../../entities';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteStore)
    private readonly favoritesRepository: Repository<FavoriteStore>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async getMine(userId: string) {
    return this.storesRepository
      .createQueryBuilder('store')
      .innerJoin('store.favorites', 'favorite', 'favorite.userId = :userId', { userId })
      .where('store.status = :status', { status: 'active' })
      .getMany();
  }

  async add(userId: string, storeId: string) {
    const store = await this.storesRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    await this.favoritesRepository.save({ userId, storeId });
    return store;
  }

  async remove(userId: string, storeId: string) {
    await this.favoritesRepository.delete({ userId, storeId });
    return { removed: true };
  }
}
