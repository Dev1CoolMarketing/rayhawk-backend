import { RequestUser } from '../auth/types/request-user.interface';
import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    getMyFavorites(user: RequestUser): Promise<import("../../entities").Store[]>;
    addFavorite(user: RequestUser, storeId: string): Promise<import("../../entities").Store>;
    removeFavorite(user: RequestUser, storeId: string): Promise<{
        removed: boolean;
    }>;
}
