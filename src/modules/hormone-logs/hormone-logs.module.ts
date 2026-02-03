import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HormoneLog, CustomerProfile } from '../../entities';
import { AuditModule } from '../audit/audit.module';
import { HormoneLogsController } from './hormone-logs.controller';
import { HormoneLogsService } from './hormone-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([HormoneLog, CustomerProfile]), AuditModule],
  controllers: [HormoneLogsController],
  providers: [HormoneLogsService],
  exports: [HormoneLogsService],
})
export class HormoneLogsModule {}
