import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../../entities';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
