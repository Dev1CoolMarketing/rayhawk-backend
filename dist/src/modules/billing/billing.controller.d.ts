import { ConfigService } from '@nestjs/config';
import { RequestUser } from '../auth/types/request-user.interface';
import { CheckoutDto } from './dto/checkout.dto';
export declare class BillingController {
    private readonly config;
    private readonly stripe?;
    private readonly appUrl;
    constructor(config: ConfigService);
    checkout(dto: CheckoutDto, user: RequestUser): Promise<{
        url: string | null;
    }>;
}
