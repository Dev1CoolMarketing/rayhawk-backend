import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vendor } from '../../entities';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UpdateVendorPlanDto } from './dto/update-vendor-plan.dto';
import { UploadVendorImageDto } from './dto/upload-vendor-image.dto';
import { MediaService } from '../media/media.service';

type PlanRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  interval: 'month' | 'year';
  currency: string;
  unit_amount_cents: number;
  stripe_price_id: string | null;
  max_stores: number | null;
  seats_included: number | null;
};

type SubscriptionRow = {
  id: string;
  status: string;
  current_period_end: string | Date | null;
  plan_id: string | null;
  plan_key: string | null;
  max_stores: number | null;
  seats_included: number | null;
};

type SubscriptionItemRow = {
  feature_type: string | null;
  quantity: number;
};

type VendorPlanOption = {
  key: string;
  name: string;
  description: string | null;
  maxStores: number | null;
  interval: 'month' | 'year';
  unitAmountCents: number;
  currency?: string;
  stripePriceId?: string | null;
};

const FALLBACK_VENDOR_PLANS: VendorPlanOption[] = [
  {
    key: 'free',
    name: 'Free',
    description: 'Try the platform with 1 store and 1 product limit.',
    maxStores: 1,
    interval: 'month',
    unitAmountCents: 0,
    currency: 'usd',
    stripePriceId: 'price_local_vendor_free',
  },
  {
    key: 'bronze',
    name: 'Bronze',
    description: 'Starter tier with 3 vendor stores included.',
    maxStores: 3,
    interval: 'month',
    unitAmountCents: 0,
    currency: 'usd',
    stripePriceId: 'price_local_vendor_bronze',
  },
  {
    key: 'silver',
    name: 'Silver',
    description: 'Grow to 5 vendor stores with added flexibility.',
    maxStores: 5,
    interval: 'month',
    unitAmountCents: 0,
    currency: 'usd',
    stripePriceId: 'price_local_vendor_silver',
  },
  {
    key: 'gold',
    name: 'Gold',
    description: 'Scale up to 10 vendor stores and prioritize support.',
    maxStores: 10,
    interval: 'month',
    unitAmountCents: 0,
    currency: 'usd',
    stripePriceId: 'price_local_vendor_gold',
  },
];

@Injectable()
export class VendorsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Vendor) private readonly vendorsRepo: Repository<Vendor>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly mediaService: MediaService,
  ) {}

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const user = await this.usersService.updateProfile(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'vendor',
    });

    let vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
    if (!vendor) {
      vendor = this.vendorsRepo.create({
        ownerId: userId,
        name: dto.vendorName,
        description: dto.vendorDescription ?? null,
        vendorImageUrl: dto.vendorImageUrl ?? null,
        vendorImagePublicId: dto.vendorImagePublicId ?? null,
        status: 'active',
      });
    } else {
      vendor.name = dto.vendorName;
      vendor.description = dto.vendorDescription ?? vendor.description ?? null;
      if (dto.vendorImageUrl !== undefined) {
        vendor.vendorImageUrl = dto.vendorImageUrl ?? null;
      }
      if (dto.vendorImagePublicId !== undefined) {
        vendor.vendorImagePublicId = dto.vendorImagePublicId ?? null;
      }
      if (vendor.status !== 'active') {
        vendor.status = 'active';
      }
    }

    const savedVendor = await this.vendorsRepo.save(vendor);

    let planState: Awaited<ReturnType<VendorsService['updatePlan']>> | null = null;
    const requestedPlanKey = dto.planKey ?? 'free';
    if (requestedPlanKey) {
      planState = await this.updatePlan(userId, { planKey: requestedPlanKey });
    }

    const selectedPlan =
      planState?.currentPlanKey && planState.plans.length
        ? planState.plans.find((plan) => plan.key === planState?.currentPlanKey) ?? null
        : null;

    return {
      user,
      vendor: savedVendor,
      plan: selectedPlan,
      entitlements: planState?.entitlements ?? null,
    };
  }

  async getProfile(userId: string) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }
    return vendor;
  }

  async updateProfile(userId: string, dto: UpdateVendorProfileDto) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (dto.name !== undefined) {
      vendor.name = dto.name;
    }
    if (dto.description !== undefined) {
      vendor.description = dto.description;
    }
    if (dto.phoneNumber !== undefined) {
      vendor.phoneNumber = dto.phoneNumber;
    }
    if (dto.vendorImageUrl !== undefined) {
      vendor.vendorImageUrl = dto.vendorImageUrl;
    }
    if (dto.vendorImagePublicId !== undefined) {
      vendor.vendorImagePublicId = dto.vendorImagePublicId;
    }

    return this.vendorsRepo.save(vendor);
  }

  async uploadImage(userId: string, dto: UploadVendorImageDto) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }
    const upload = await this.mediaService.uploadBase64Image(dto.file, `vendors/${vendor.id}`);
    vendor.vendorImageUrl = upload.url;
    vendor.vendorImagePublicId = upload.publicId;
    await this.vendorsRepo.save(vendor);
    return upload;
  }

  async listPlans(userId: string) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const billingState = await this.loadBillingState(vendor.id);
    if (!billingState) {
      return this.buildPlanState(vendor.id, FALLBACK_VENDOR_PLANS, null, [], 'free');
    }

    const plans = billingState.plans.map(this.mapPlanRowToOption);
    const hasFreePlan = plans.some((plan) => plan.key === 'free');
    const defaultPlanKey = billingState.subscription ? undefined : hasFreePlan ? 'free' : undefined;
    return this.buildPlanState(vendor.id, plans, billingState.subscription, billingState.items, defaultPlanKey);
  }

  async updatePlan(userId: string, dto: UpdateVendorPlanDto) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const requestedKey = dto.planKey?.trim();
    if (!requestedKey) {
      throw new BadRequestException('planKey is required');
    }

    const billingState = await this.loadBillingState(vendor.id);
    if (!billingState) {
      return this.buildPlanState(vendor.id, FALLBACK_VENDOR_PLANS, null, [], requestedKey);
    }

    const plan = billingState.plans.find((row) => row.key === requestedKey);
    if (!plan) {
      throw new BadRequestException('Unknown plan key');
    }

    let subscription = billingState.subscription;
    let planKeyOverride: string | null | undefined;
    if (subscription) {
      await this.dataSource.query(
        `UPDATE billing.billing_subscriptions SET plan_id = $1, stripe_price_id = $2, updated_at = now() WHERE id = $3`,
        [plan.id, plan.stripe_price_id ?? '', subscription.id],
      );
      subscription = {
        ...subscription,
        plan_id: plan.id,
        plan_key: plan.key,
        max_stores: plan.max_stores,
        seats_included: plan.seats_included,
      };
      planKeyOverride = plan.key;
    } else if (plan.key === 'free') {
      planKeyOverride = plan.key;
    } else if (!this.isProduction()) {
      const manualStripeId = `manual_${vendor.id}_${Date.now()}`;
      const inserted = await this.dataSource.query(
        `INSERT INTO billing.billing_subscriptions (vendor_id, plan_id, stripe_subscription_id, stripe_price_id, status, quantity, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', 1, now(), now())
         RETURNING id, status, current_period_end`,
        [vendor.id, plan.id, manualStripeId, plan.stripe_price_id ?? ''],
      );
      const insertedRow = inserted?.[0] as { id?: string; status?: string; current_period_end?: string | Date | null } | undefined;
      subscription = {
        id: insertedRow?.id ?? '',
        status: insertedRow?.status ?? 'active',
        current_period_end: insertedRow?.current_period_end ?? null,
        plan_id: plan.id,
        plan_key: plan.key,
        max_stores: plan.max_stores,
        seats_included: plan.seats_included,
      };
      planKeyOverride = plan.key;
    }

    const plans = billingState.plans.map(this.mapPlanRowToOption);
    return this.buildPlanState(vendor.id, plans, subscription, billingState.items, planKeyOverride);
  }

  private mapPlanRowToOption(row: PlanRow): VendorPlanOption {
    return {
      key: row.key,
      name: row.name,
      description: row.description ?? null,
      maxStores: row.max_stores ?? null,
      interval: row.interval,
      unitAmountCents: row.unit_amount_cents,
      currency: row.currency,
      stripePriceId: row.stripe_price_id ?? null,
    };
  }

  private buildPlanState(
    vendorId: string,
    plans: VendorPlanOption[],
    subscription: SubscriptionRow | null,
    items: SubscriptionItemRow[],
    planKeyOverride?: string | null,
  ) {
    const currentPlanKey = planKeyOverride ?? subscription?.plan_key ?? null;
    const planForEntitlements = currentPlanKey ? plans.find((plan) => plan.key === currentPlanKey) ?? null : null;
    const storesAddOns = items.reduce((total, item) => {
      if (item.feature_type === 'stores' || item.feature_type === 'store') {
        return total + (item.quantity ?? 0);
      }
      return total;
    }, 0);
    const seatsAddOns = items.reduce((total, item) => {
      if (item.feature_type === 'seats' || item.feature_type === 'seat') {
        return total + (item.quantity ?? 0);
      }
      return total;
    }, 0);
    const status = subscription?.status ?? (planKeyOverride === 'free' ? 'active' : null);
    const currentPeriodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end).toISOString()
      : null;
    const isActive = status === 'active' || status === 'trialing';
    const storesAllowed =
      planForEntitlements?.maxStores === null
        ? null
        : planForEntitlements?.maxStores != null
          ? planForEntitlements.maxStores + storesAddOns
          : null;
    const seatsAllowed =
      subscription?.seats_included != null ? subscription.seats_included + seatsAddOns : null;

    return {
      vendorId,
      currentPlanKey,
      entitlements: {
        planKey: currentPlanKey,
        status,
        currentPeriodEnd,
        isActive,
        seatsAllowed,
        storesAllowed,
        productsPerStoreAllowed: null,
        seatsAddOns,
        storesAddOns,
      },
      plans,
    };
  }

  private async loadBillingState(vendorId: string) {
    try {
      const plans = (await this.dataSource.query(
        `SELECT id, key, name, description, interval, currency, unit_amount_cents, stripe_price_id, max_stores, seats_included
         FROM billing.billing_plans
         WHERE is_active = true
         ORDER BY key`,
      )) as PlanRow[];

      const subscriptions = (await this.dataSource.query(
        `SELECT bs.id,
                bs.status,
                bs.current_period_end,
                bs.plan_id,
                bp.key as plan_key,
                bp.max_stores,
                bp.seats_included
         FROM billing.billing_subscriptions bs
         LEFT JOIN billing.billing_plans bp ON bp.id = bs.plan_id
         WHERE bs.vendor_id = $1
         ORDER BY bs.updated_at DESC NULLS LAST
         LIMIT 1`,
        [vendorId],
      )) as SubscriptionRow[];

      const items = (await this.dataSource.query(
        `SELECT feature_type, quantity
         FROM billing.billing_subscription_items
         WHERE vendor_id = $1`,
        [vendorId],
      )) as SubscriptionItemRow[];

      return {
        plans,
        subscription: subscriptions?.[0] ?? null,
        items,
      };
    } catch (error) {
      if (this.isMissingBillingSchema(error)) {
        return null;
      }
      throw error;
    }
  }

  private isMissingBillingSchema(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    return code === '3F000' || code === '42P01';
  }

  private isProduction() {
    return (this.config.get<string>('NODE_ENV') ?? '').toLowerCase() === 'production';
  }
}
