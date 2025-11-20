import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullMqModule } from '../../infra/bullmq.module';
import { ReportsModule } from '../reports/reports.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [ConfigModule, ReportsModule, BullMqModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
