import { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { LeadCredit, Subscription } from '../../entities';
export declare class StripeWebhookController {
    private readonly config;
    private readonly subscriptionsRepository;
    private readonly leadCreditsRepository;
    private readonly stripe?;
    constructor(config: ConfigService, subscriptionsRepository: Repository<Subscription>, leadCreditsRepository: Repository<LeadCredit>);
    handleStripe(req: RawBodyRequest<Request>, signature: string | string[]): Promise<{
        received: boolean;
    }>;
    private handleCheckoutCompleted;
    private syncSubscription;
    private creditLeadAccount;
}
