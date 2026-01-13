import { BillingInterval } from '../types/billing.types';

export type VendorPlanKey = 'free' | 'bronze' | 'silver' | 'gold';

export interface VendorPlanSeed {
  key: VendorPlanKey;
  name: string;
  description: string;
  interval: BillingInterval;
  currency: string;
  unitAmountCents: number;
  stripePriceId: string;
  stripeProductId?: string;
  seatsIncluded?: number;
  maxStores: number;
}

export const VENDOR_PLAN_KEYS: VendorPlanKey[] = ['free', 'bronze', 'silver', 'gold'];
export const VISIBLE_VENDOR_PLAN_KEYS: VendorPlanKey[] = ['free', 'bronze', 'silver', 'gold'];

// Per-tier product allowance for each store. Null means unlimited per store.
export const PRODUCTS_PER_STORE_BY_PLAN: Record<VendorPlanKey, number | null> = {
  free: 1,
  bronze: 2,
  silver: 3,
  gold: 5,
};

export const DEFAULT_VENDOR_PLANS: VendorPlanSeed[] = [
  {
    key: 'free',
    name: 'Free',
    description: 'Starter tier with 1 store and 1 product limit.',
    interval: 'month',
    currency: 'usd',
    unitAmountCents: 0,
    stripePriceId: '',
    stripeProductId: 'prod_local_vendor_free',
    seatsIncluded: 1,
    maxStores: 1,
  },
  {
    key: 'bronze',
    name: 'Bronze',
    description: 'Starter tier with 3 vendor stores included.',
    interval: 'month',
    currency: 'usd',
    unitAmountCents: 0,
    stripePriceId: 'price_1Scs0rFneQ9ajNbOMhNNRS6T',
    stripeProductId: 'prod_local_vendor_bronze',
    seatsIncluded: 1,
    maxStores: 3,
  },
  {
    key: 'silver',
    name: 'Silver',
    description: 'Grow to 5 vendor stores with added flexibility.',
    interval: 'month',
    currency: 'usd',
    unitAmountCents: 0,
    stripePriceId: 'price_1Scs13FneQ9ajNbO3KYDEgQz',
    stripeProductId: 'prod_local_vendor_silver',
    seatsIncluded: 1,
    maxStores: 5,
  },
  {
    key: 'gold',
    name: 'Gold',
    description: 'Scale up to 10 vendor stores and prioritize support.',
    interval: 'month',
    currency: 'usd',
    unitAmountCents: 0,
    stripePriceId: 'price_1Scs1VFneQ9ajNbOFd4Ab23j',
    stripeProductId: 'prod_local_vendor_gold',
    seatsIncluded: 1,
    maxStores: 10,
  },
];
