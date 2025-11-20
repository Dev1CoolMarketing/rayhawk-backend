import { Queue } from 'bullmq';
import { ReportsService } from '../reports/reports.service';
export declare class JobsService {
    private readonly reportsQueue;
    private readonly reportsService;
    private readonly logger;
    constructor(reportsQueue: Queue | null, reportsService: ReportsService);
    enqueueDailySummary(accountId?: string): Promise<import("bullmq").Job<any, any, string> | undefined>;
}
