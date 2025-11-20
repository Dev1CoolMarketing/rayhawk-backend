import { ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly jobsService;
    private readonly config;
    constructor(jobsService: JobsService, config: ConfigService);
    enqueueDaily(rawToken: string | string[], accountId?: string): Promise<{
        enqueued: boolean;
    }>;
}
