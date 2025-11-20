import { Repository } from 'typeorm';
import { CustomerProfile, FavoriteStore, Store } from '../../entities';
export declare class CustomersService {
    private readonly profilesRepo;
    private readonly favoritesRepo;
    private readonly storesRepo;
    constructor(profilesRepo: Repository<CustomerProfile>, favoritesRepo: Repository<FavoriteStore>, storesRepo: Repository<Store>);
    createProfile(userId: string, birthYear: number): Promise<CustomerProfile>;
    upsertProfile(userId: string, birthYear: number): Promise<CustomerProfile>;
    hasProfile(userId: string): Promise<boolean>;
    findProfile(userId: string): Promise<CustomerProfile | null>;
    requireProfile(userId: string): Promise<CustomerProfile>;
    listFavoriteStores(userId: string): Promise<{
        id: string;
        name: string;
        city: string;
        state: string;
        status: string;
        slug: string;
        imageUrl: string | null;
    }[]>;
    addFavorite(userId: string, storeId: string): Promise<{
        id: string;
        name: string;
        city: string;
        state: string;
        status: string;
        slug: string;
        imageUrl: string | null;
    }[]>;
    removeFavorite(userId: string, storeId: string): Promise<{
        id: string;
        name: string;
        city: string;
        state: string;
        status: string;
        slug: string;
        imageUrl: string | null;
    }[]>;
    private generateUniqueUsername;
    private mapStore;
}
