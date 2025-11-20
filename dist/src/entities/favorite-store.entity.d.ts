import { Store } from './store.entity';
import { User } from './user.entity';
export declare class FavoriteStore {
    userId: string;
    storeId: string;
    createdAt: Date;
    store: Store;
    user: User;
}
