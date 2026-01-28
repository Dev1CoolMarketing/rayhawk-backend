import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { REPORTS_QUEUE } from '../../infra/bullmq.module';
import { ReportsService } from '../reports/reports.service';
import { AnalyticsEvent, AuditLog } from '../../entities';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @Inject(REPORTS_QUEUE) @Optional() private readonly reportsQueue: Queue | null,
    private readonly reportsService: ReportsService,
    private readonly config: ConfigService,
    @InjectRepository(AnalyticsEvent) private readonly analyticsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
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

  async cleanupRetention() {
    const analyticsDays = Number(this.config.get<string>('ANALYTICS_RETENTION_DAYS') ?? '365');
    const auditDays = Number(this.config.get<string>('AUDIT_LOG_RETENTION_DAYS') ?? '730');

    const now = Date.now();
    let analyticsDeleted = 0;
    let auditDeleted = 0;

    if (Number.isFinite(analyticsDays) && analyticsDays > 0) {
      const cutoff = new Date(now - analyticsDays * 24 * 60 * 60 * 1000);
      const result = await this.analyticsRepo.delete({ occurredAt: LessThan(cutoff) });
      analyticsDeleted = result.affected ?? 0;
    }

    if (Number.isFinite(auditDays) && auditDays > 0) {
      const cutoff = new Date(now - auditDays * 24 * 60 * 60 * 1000);
      const result = await this.auditRepo.delete({ createdAt: LessThan(cutoff) });
      auditDeleted = result.affected ?? 0;
    }

    this.logger.log(`Retention cleanup complete. analytics=${analyticsDeleted} audit=${auditDeleted}`);
    return { analyticsDeleted, auditDeleted };
  }
}
