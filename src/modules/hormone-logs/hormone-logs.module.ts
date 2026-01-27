import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerProfile, HormoneLog } from '../../entities';
import { HormoneLogsController } from './hormone-logs.controller';
import { HormoneLogsService } from './hormone-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([HormoneLog, CustomerProfile])],
  controllers: [HormoneLogsController],
  providers: [HormoneLogsService],
  exports: [HormoneLogsService],
})
export class HormoneLogsModule {}
