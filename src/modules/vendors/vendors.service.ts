import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../entities';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly usersService: UsersService,
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
    return {
      user,
      vendor: savedVendor,
    };
  }
}
