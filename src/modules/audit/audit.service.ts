import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(@InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>) {}

  async record(entry: {
    actorUserId: string;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      const audit = this.auditRepo.create({
        actorUserId: entry.actorUserId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        metadata: entry.metadata ?? null,
      });
      await this.auditRepo.save(audit);
    } catch (error) {
      this.logger.error('Failed to write audit log', error as any);
    }
  }
}
