import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../entities';
import { AuditLogsService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditModule {}
