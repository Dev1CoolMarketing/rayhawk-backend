/**
 * Plan:
 * - New table/core entity: hormone_logs (user-scoped tracking for testosterone/estradiol, dose, form factor, mood).
 * - Endpoints: create log, latest log, list my logs, admin summary aggregates (anonymized).
 * - UI: surface latest + mini history + add form on profile (to be wired in mobile account screen).
 */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HormoneLog, HormoneFormFactor, CustomerProfile } from '../../entities';
import { CreateHormoneLogDto } from './dto/create-hormone-log.dto';
import { HormoneLogResponseDto, HormoneLogSummaryDto } from './dto/hormone-log-response.dto';

@Injectable()
export class HormoneLogsService {
  constructor(
    @InjectRepository(HormoneLog) private readonly logsRepo: Repository<HormoneLog>,
    @InjectRepository(CustomerProfile) private readonly profilesRepo: Repository<CustomerProfile>,
  ) {}

  async create(userId: string, role: string, dto: CreateHormoneLogDto): Promise<HormoneLogResponseDto> {
    if (role !== 'customer') {
      throw new ForbiddenException('Only customers can log hormone tracking entries');
    }
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }
    const dateTaken = dto.dateTaken ? new Date(dto.dateTaken).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const log = this.logsRepo.create({
      customerProfileId: profile.userId,
      testosteroneNgDl: dto.testosteroneLevel,
      estradiolPgMl: dto.estradiolLevel,
      doseMg: dto.doseMg,
      formFactor: dto.formFactor,
      dateTaken,
      moodScore: dto.moodScore,
      moodNotes: dto.moodNotes?.trim() || null,
    });
    const saved = await this.logsRepo.save(log);
    return this.mapLog(saved);
  }

  async latestForUser(userId: string): Promise<HormoneLogResponseDto | null> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      return null;
    }
    const log = await this.logsRepo.findOne({
      where: { customerProfileId: profile.userId },
      order: { dateTaken: 'DESC', createdAt: 'DESC' },
    });
    return log ? this.mapLog(log) : null;
  }

  async listForUser(userId: string, limit = 20, offset = 0): Promise<HormoneLogResponseDto[]> {
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      return [];
    }
    const logs = await this.logsRepo.find({
      where: { customerProfileId: profile.userId },
      order: { dateTaken: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return logs.map((log) => this.mapLog(log));
  }

  async summary(): Promise<HormoneLogSummaryDto> {
    const qb = this.logsRepo.createQueryBuilder('log');
    const rows = await qb
      .select('COUNT(*)', 'total')
      .addSelect('AVG(log.testosteroneNgDl)', 'avgTestosterone')
      .addSelect('AVG(log.estradiolPgMl)', 'avgEstradiol')
      .addSelect('AVG(log.doseMg)', 'avgDoseMg')
      .getRawOne<{
        total: string;
        avgTestosterone: string | null;
        avgEstradiol: string | null;
        avgDoseMg: string | null;
      }>();

    const byFormFactor = await this.logsRepo
      .createQueryBuilder('log')
      .select('log.formFactor', 'formFactor')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(log.testosteroneNgDl)', 'avgTestosterone')
      .groupBy('log.formFactor')
      .getRawMany<{ formFactor: HormoneFormFactor; count: string; avgTestosterone: string | null }>();

    const byMood = await this.logsRepo
      .createQueryBuilder('log')
      .select('log.moodScore', 'moodScore')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.moodScore')
      .getRawMany<{ moodScore: number; count: string }>();

    return {
      avgTestosterone: rows?.avgTestosterone ? Number(rows.avgTestosterone) : null,
      avgEstradiol: rows?.avgEstradiol ? Number(rows.avgEstradiol) : null,
      avgDoseMg: rows?.avgDoseMg ? Number(rows.avgDoseMg) : null,
      totalLogs: rows?.total ? Number(rows.total) : 0,
      byFormFactor: byFormFactor.map((row) => ({
        formFactor: row.formFactor,
        count: Number(row.count) || 0,
        avgTestosterone: row.avgTestosterone ? Number(row.avgTestosterone) : null,
      })),
      byMood: byMood.map((row) => ({ moodScore: Number(row.moodScore), count: Number(row.count) || 0 })),
    };
  }

  private mapLog(log: HormoneLog): HormoneLogResponseDto {
    return {
      id: log.id,
      testosteroneLevel: Number(log.testosteroneNgDl),
      estradiolLevel: Number(log.estradiolPgMl),
      doseMg: Number(log.doseMg),
      formFactor: log.formFactor,
      dateTaken: log.dateTaken,
      moodScore: log.moodScore,
      moodNotes: log.moodNotes ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
