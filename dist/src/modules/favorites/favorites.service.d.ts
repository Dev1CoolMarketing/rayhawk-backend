import { Repository } from 'typeorm';
import { FavoriteStore, Store } from '../../entities';
export declare class FavoritesService {
    private readonly favoritesRepository;
    private readonly storesRepository;
    constructor(favoritesRepository: Repository<FavoriteStore>, storesRepository: Repository<Store>);
    getMine(userId: string): Promise<Store[]>;
    add(userId: string, storeId: string): Promise<Store>;
    remove(userId: string, storeId: string): Promise<{
        removed: boolean;
    }>;
}
