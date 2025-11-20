import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { VendorsService } from './vendors.service';
import { RequestUser } from '../auth/types/request-user.interface';
export declare class VendorsController {
    private readonly vendorsService;
    constructor(vendorsService: VendorsService);
    completeOnboarding(dto: CompleteOnboardingDto, user: RequestUser): Promise<{
        user: import("../../entities").User;
        vendor: import("../../entities").Vendor;
    }>;
}
