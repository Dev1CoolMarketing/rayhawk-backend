import { FavoriteStore } from './favorite-store.entity';
import { Product } from './product.entity';
import { Vendor } from './vendor.entity';
export declare class Store {
    id: string;
    vendorId: string;
    vendor?: Vendor;
    name: string;
    description?: string | null;
    slug: string;
    status: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    openingHours?: string[] | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    favorites?: FavoriteStore[];
    products?: Product[];
}
