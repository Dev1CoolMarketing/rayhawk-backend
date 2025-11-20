import { Store } from './store.entity';
export declare class Product {
    id: string;
    storeId: string;
    store?: Store;
    name: string;
    description?: string | null;
    priceCents: number;
    status: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    linkUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
