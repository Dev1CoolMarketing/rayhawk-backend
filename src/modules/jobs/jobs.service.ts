import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import { REPORTS_QUEUE } from '../../infra/bullmq.module';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @Inject(REPORTS_QUEUE) @Optional() private readonly reportsQueue: Queue | null,
    private readonly reportsService: ReportsService,
  ) {}

  async enqueueDailySummary(accountId?: string) {
    if (!this.reportsQueue) {
      this.logger.warn('Reports queue disabled (no REDIS_URL); skipping enqueueDailySummary call');
      return;
    }
    const summary = await this.reportsService.dailySummary(accountId);
    return this.reportsQueue.add(
      'daily-summary',
      { accountId: accountId ?? null, summary },
      { removeOnComplete: true, removeOnFail: true },
    );
  }
}
