export type BillingInterval = 'month' | 'year';

export type VendorPlanKey = 'bronze' | 'silver' | 'gold';

export type BillingSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface BillingPlanSummary {
  key: string;
  name: string;
  description?: string | null;
  interval: BillingInterval;
  currency: string;
  unitAmountCents: number;
  maxStores: number | null;
  stripePriceId: string;
}

export interface BillingEntitlements {
  planKey: string | null;
  status: BillingSubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  isActive: boolean;
  seatsAllowed: number | null;
  storesAllowed: number | null;
  productsPerStoreAllowed: number | null;
  seatsAddOns: number;
  storesAddOns: number;
}
