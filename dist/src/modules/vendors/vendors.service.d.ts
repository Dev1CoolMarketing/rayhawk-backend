import { Repository } from 'typeorm';
import { Vendor } from '../../entities';
import { UsersService } from '../users/users.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
export declare class VendorsService {
    private readonly usersService;
    private readonly vendorsRepo;
    constructor(usersService: UsersService, vendorsRepo: Repository<Vendor>);
    completeOnboarding(userId: string, dto: CompleteOnboardingDto): Promise<{
        user: import("../../entities").User;
        vendor: Vendor;
    }>;
}
