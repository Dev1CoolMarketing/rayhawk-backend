import { Subscription } from './subscription.entity';
import { Store } from './store.entity';
export declare class Vendor {
    id: string;
    ownerId: string;
    name: string;
    description?: string | null;
    stripeAccountId?: string | null;
    status: string;
    createdAt: Date;
    subscriptions?: Subscription[];
    stores?: Store[];
}
