import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullMqModule } from '../../infra/bullmq.module';
import { AnalyticsEvent, AuditLog } from '../../entities';
import { ReportsModule } from '../reports/reports.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [ConfigModule, ReportsModule, BullMqModule, TypeOrmModule.forFeature([AnalyticsEvent, AuditLog])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
