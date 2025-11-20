import { RequestUser } from '../auth/types/request-user.interface';
import { CustomersService } from './customers.service';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
export declare class CustomersController {
    private readonly customers;
    constructor(customers: CustomersService);
    getMe(user: RequestUser): Promise<{
        profile: {
            username: string;
            birthYear: number;
            createdAt: string;
            updatedAt: string;
        };
        favorites: {
            id: string;
            name: string;
            city: string;
            state: string;
            status: string;
            slug: string;
            imageUrl: string | null;
        }[];
    }>;
    addFavorite(user: RequestUser, storeId: string): Promise<{
        id: string;
        name: string;
        city: string;
        state: string;
        status: string;
        slug: string;
        imageUrl: string | null;
    }[]>;
    removeFavorite(user: RequestUser, storeId: string): Promise<{
        id: string;
        name: string;
        city: string;
        state: string;
        status: string;
        slug: string;
        imageUrl: string | null;
    }[]>;
    createProfile(user: RequestUser, dto: CreateCustomerProfileDto): Promise<{
        username: string;
        birthYear: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private ensureCustomer;
}
