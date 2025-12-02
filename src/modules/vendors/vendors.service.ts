import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../entities';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { BillingService } from '../billing/billing.service';
import { VendorPlanKey } from '../billing/constants/vendor-plans';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
    @InjectRepository(Vendor) private readonly vendorsRepo: Repository<Vendor>,
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
        status: 'active',
      });
    } else {
      vendor.name = dto.vendorName;
      vendor.description = dto.vendorDescription ?? vendor.description ?? null;
      if (vendor.status !== 'active') {
        vendor.status = 'active';
      }
    }

    const savedVendor = await this.vendorsRepo.save(vendor);
    const selectedPlanKey: VendorPlanKey = dto.planKey ?? 'free';
    const planSelection = await this.billingService.applyPlanToVendor(savedVendor.id, selectedPlanKey);

    return {
      user,
      vendor: savedVendor,
      plan: planSelection.plan,
      entitlements: planSelection.entitlements,
    };
  }

  async getPlanOptions(ownerId: string) {
    const [plans, vendor] = await Promise.all([
      this.billingService.listPlans(),
      this.vendorsRepo.findOne({ where: { ownerId } }),
    ]);

    const entitlements = vendor ? await this.billingService.getVendorEntitlements(vendor.id) : null;

    return {
      vendorId: vendor?.id ?? null,
      currentPlanKey: entitlements?.planKey ?? null,
      entitlements,
      plans,
    };
  }

  async updatePlan(ownerId: string, planKey: VendorPlanKey) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId } });
    if (!vendor) {
      throw new ForbiddenException('Vendor onboarding required before selecting a plan');
    }

    if (vendor.status !== 'active') {
      throw new ForbiddenException('Vendor account is not active');
    }

    const planSelection = await this.billingService.applyPlanToVendor(vendor.id, planKey);
    const plans = await this.billingService.listPlans();
    return {
      vendorId: vendor.id,
      currentPlanKey: planSelection.entitlements?.planKey ?? planSelection.plan.key,
      entitlements: planSelection.entitlements,
      plans,
    };
  }

  async getVendorProfile(ownerId: string) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId } });
    if (!vendor) {
      throw new ForbiddenException('Vendor onboarding required before viewing profile');
    }
    return vendor;
  }

  async updateVendorProfile(ownerId: string, dto: UpdateVendorDto) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId } });
    if (!vendor) {
      throw new ForbiddenException('Vendor onboarding required before updating profile');
    }
    if (dto.name !== undefined) {
      vendor.name = dto.name;
    }
    if (dto.description !== undefined) {
      vendor.description = dto.description ?? null;
    }
    if (dto.phoneNumber !== undefined) {
      vendor.phoneNumber = dto.phoneNumber.trim().length ? dto.phoneNumber.trim() : null;
    }
    return this.vendorsRepo.save(vendor);
  }
}
