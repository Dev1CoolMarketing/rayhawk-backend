import { Vendor } from './vendor.entity';
export declare class Subscription {
    id: string;
    vendor: Vendor;
    vendorId: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    status: string;
    currentPeriodEnd?: Date | null;
    createdAt: Date;
}
