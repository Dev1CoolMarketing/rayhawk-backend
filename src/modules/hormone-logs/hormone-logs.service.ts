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
import { UpdateHormoneLogDto } from './dto/update-hormone-log.dto';

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
    const dateTaken = dto.dateTaken ? new Date(dto.dateTaken) : new Date();
    const log = this.logsRepo.create({
      customerProfileId: profile.userId,
      testosteroneNgDl: dto.testosteroneLevel,
      estradiolPgMl: dto.estradiolLevel,
      doseMg: dto.doseMg,
      formFactor: dto.formFactor,
      dateTaken,
      moodScore: dto.moodScore,
      moodNotes: dto.moodNotes?.trim() || null,
      erectionStrength: dto.erectionStrength ?? null,
      morningErections: dto.morningErections ?? null,
      libido: dto.libido ?? null,
      sexualThoughts: dto.sexualThoughts ?? null,
      energyLevels: dto.energyLevels ?? null,
      moodStability: dto.moodStability ?? null,
      strengthEndurance: dto.strengthEndurance ?? null,
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

  async update(userId: string, role: string, id: string, dto: UpdateHormoneLogDto): Promise<HormoneLogResponseDto> {
    if (role !== 'customer') {
      throw new ForbiddenException('Only customers can update hormone tracking entries');
    }
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }
    const log = await this.logsRepo.findOne({ where: { id, customerProfileId: profile.userId } });
    if (!log) {
      throw new NotFoundException('Log not found');
    }

    if (dto.dateTaken) {
      log.dateTaken = new Date(dto.dateTaken);
    }
    if (dto.testosteroneLevel !== undefined) log.testosteroneNgDl = dto.testosteroneLevel;
    if (dto.estradiolLevel !== undefined) log.estradiolPgMl = dto.estradiolLevel;
    if (dto.doseMg !== undefined) log.doseMg = dto.doseMg;
    if (dto.formFactor) log.formFactor = dto.formFactor;
    if (dto.moodScore !== undefined) log.moodScore = dto.moodScore;
    if (dto.moodNotes !== undefined) log.moodNotes = dto.moodNotes?.trim() || null;
    if (dto.erectionStrength !== undefined) log.erectionStrength = dto.erectionStrength ?? null;
    if (dto.morningErections !== undefined) log.morningErections = dto.morningErections ?? null;
    if (dto.libido !== undefined) log.libido = dto.libido ?? null;
    if (dto.sexualThoughts !== undefined) log.sexualThoughts = dto.sexualThoughts ?? null;
    if (dto.energyLevels !== undefined) log.energyLevels = dto.energyLevels ?? null;
    if (dto.moodStability !== undefined) log.moodStability = dto.moodStability ?? null;
    if (dto.strengthEndurance !== undefined) log.strengthEndurance = dto.strengthEndurance ?? null;

    const saved = await this.logsRepo.save(log);
    return this.mapLog(saved);
  }

  async remove(userId: string, role: string, id: string): Promise<void> {
    if (role !== 'customer') {
      throw new ForbiddenException('Only customers can delete hormone tracking entries');
    }
    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }
    const result = await this.logsRepo.delete({ id, customerProfileId: profile.userId });
    if (!result.affected) {
      throw new NotFoundException('Log not found');
    }
  }

  private mapLog(log: HormoneLog): HormoneLogResponseDto {
    return {
      id: log.id,
      testosteroneLevel: Number(log.testosteroneNgDl),
      estradiolLevel: Number(log.estradiolPgMl),
      doseMg: Number(log.doseMg),
      formFactor: log.formFactor,
      dateTaken: log.dateTaken.toISOString(),
      moodScore: log.moodScore,
      moodNotes: log.moodNotes ?? null,
      erectionStrength: log.erectionStrength ?? null,
      morningErections: log.morningErections ?? null,
      libido: log.libido ?? null,
      sexualThoughts: log.sexualThoughts ?? null,
      energyLevels: log.energyLevels ?? null,
      moodStability: log.moodStability ?? null,
      strengthEndurance: log.strengthEndurance ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
