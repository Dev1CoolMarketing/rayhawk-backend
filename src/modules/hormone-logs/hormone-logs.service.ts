import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CustomerProfile, HormoneLog } from '../../entities';
import { CreateHormoneLogDto } from './dto/create-hormone-log.dto';
import { HormoneLogResponseDto } from './dto/hormone-log-response.dto';
import { UpdateHormoneLogDto } from './dto/update-hormone-log.dto';

@Injectable()
export class HormoneLogsService {
  constructor(
    @InjectRepository(HormoneLog)
    private readonly logsRepo: Repository<HormoneLog>,
    @InjectRepository(CustomerProfile)
    private readonly profilesRepo: Repository<CustomerProfile>,
  ) {}

  async create(
    userId: string,
    role: string,
    dto: CreateHormoneLogDto,
    hasCustomerProfile = false,
  ): Promise<HormoneLogResponseDto> {
    if (role !== 'customer' && !hasCustomerProfile) {
      throw new ForbiddenException('Only customers can log hormone tracking entries');
    }

    const profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }

    const logType = dto.logType ?? 'monthly';

    if (logType === 'monthly') {
      const missing: string[] = [];
      if (dto.testosteroneLevel === undefined) missing.push('testosterone level');
      if (dto.estradiolLevel === undefined) missing.push('estradiol level');
      if (dto.doseMg === undefined) missing.push('dose');
      if (!dto.formFactor) missing.push('form factor');
      if (dto.moodScore === undefined) missing.push('mood score');

      if (missing.length) {
        throw new BadRequestException(`Missing required fields: ${missing.join(', ')}.`);
      }
    }

    if (logType === 'vitality') {
      const hasVitalityScores = [
        dto.erectionStrength,
        dto.morningErections,
        dto.libido,
        dto.sexualThoughts,
        dto.energyLevels,
        dto.moodStability,
        dto.strengthEndurance,
        dto.concentrationSharpness,
        dto.bodyComposition,
        dto.sleepQuality,
      ].some((value) => typeof value === 'number');

      const hasExtras = [
        dto.testosteroneLevel,
        dto.exerciseDurationMinutes,
        dto.exerciseIntensity,
        dto.sleepHours,
        dto.stressLevel,
        dto.weightLbs,
      ].some((value) => value !== undefined && value !== null && value !== '');

      if (!hasVitalityScores && !hasExtras) {
        throw new BadRequestException('Add at least one vitality score or optional metric before saving.');
      }
    }

    const dateTaken = dto.dateTaken ? new Date(dto.dateTaken) : new Date();
    const log = this.logsRepo.create({
      customerProfileId: profile.userId,
      logType,
      testosteroneNgDl: dto.testosteroneLevel ?? null,
      estradiolPgMl: dto.estradiolLevel ?? null,
      doseMg: dto.doseMg ?? null,
      formFactor: dto.formFactor ?? null,
      dateTaken,
      moodScore: dto.moodScore ?? null,
      moodNotes: dto.moodNotes?.trim() || null,
      erectionStrength: dto.erectionStrength ?? null,
      morningErections: dto.morningErections ?? null,
      libido: dto.libido ?? null,
      sexualThoughts: dto.sexualThoughts ?? null,
      energyLevels: dto.energyLevels ?? null,
      moodStability: dto.moodStability ?? null,
      strengthEndurance: dto.strengthEndurance ?? null,
      concentrationSharpness: dto.concentrationSharpness ?? null,
      bodyComposition: dto.bodyComposition ?? null,
      sleepQuality: dto.sleepQuality ?? null,
      exerciseDurationMinutes: dto.exerciseDurationMinutes ?? null,
      exerciseIntensity: dto.exerciseIntensity?.trim() || null,
      sleepHours: dto.sleepHours ?? null,
      stressLevel: dto.stressLevel ?? null,
      weightLbs: dto.weightLbs ?? null,
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

  async summary() {
    const qb = this.logsRepo.createQueryBuilder('log').where('log.logType = :logType', { logType: 'monthly' });

    const rows = await qb
      .select('COUNT(*)', 'total')
      .addSelect('AVG(log.testosteroneNgDl)', 'avgTestosterone')
      .addSelect('AVG(log.estradiolPgMl)', 'avgEstradiol')
      .addSelect('AVG(log.doseMg)', 'avgDoseMg')
      .getRawOne();

    const byFormFactor = await this.logsRepo
      .createQueryBuilder('log')
      .where('log.logType = :logType', { logType: 'monthly' })
      .select('log.formFactor', 'formFactor')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(log.testosteroneNgDl)', 'avgTestosterone')
      .groupBy('log.formFactor')
      .getRawMany();

    const byMood = await this.logsRepo
      .createQueryBuilder('log')
      .where('log.logType = :logType', { logType: 'monthly' })
      .select('log.moodScore', 'moodScore')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.moodScore')
      .getRawMany();

    return {
      avgTestosterone: rows?.avgTestosterone ? Number(rows.avgTestosterone) : null,
      avgEstradiol: rows?.avgEstradiol ? Number(rows.avgEstradiol) : null,
      avgDoseMg: rows?.avgDoseMg ? Number(rows.avgDoseMg) : null,
      totalLogs: rows?.total ? Number(rows.total) : 0,
      byFormFactor: byFormFactor.map((row: { formFactor: string; count: string; avgTestosterone: string | null }) => ({
        formFactor: row.formFactor,
        count: Number(row.count) || 0,
        avgTestosterone: row.avgTestosterone ? Number(row.avgTestosterone) : null,
      })),
      byMood: byMood.map((row: { moodScore: string; count: string }) => ({
        moodScore: Number(row.moodScore),
        count: Number(row.count) || 0,
      })),
    };
  }

  async update(
    userId: string,
    role: string,
    id: string,
    dto: UpdateHormoneLogDto,
    hasCustomerProfile = false,
  ): Promise<HormoneLogResponseDto> {
    if (role !== 'customer' && !hasCustomerProfile) {
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
    if (dto.logType) log.logType = dto.logType;
    if (dto.testosteroneLevel !== undefined) log.testosteroneNgDl = dto.testosteroneLevel;
    if (dto.estradiolLevel !== undefined) log.estradiolPgMl = dto.estradiolLevel;
    if (dto.doseMg !== undefined) log.doseMg = dto.doseMg;
    if (dto.formFactor !== undefined) log.formFactor = dto.formFactor ?? null;
    if (dto.moodScore !== undefined) log.moodScore = dto.moodScore;
    if (dto.moodNotes !== undefined) log.moodNotes = dto.moodNotes?.trim() || null;
    if (dto.erectionStrength !== undefined) log.erectionStrength = dto.erectionStrength ?? null;
    if (dto.morningErections !== undefined) log.morningErections = dto.morningErections ?? null;
    if (dto.libido !== undefined) log.libido = dto.libido ?? null;
    if (dto.sexualThoughts !== undefined) log.sexualThoughts = dto.sexualThoughts ?? null;
    if (dto.energyLevels !== undefined) log.energyLevels = dto.energyLevels ?? null;
    if (dto.moodStability !== undefined) log.moodStability = dto.moodStability ?? null;
    if (dto.strengthEndurance !== undefined) log.strengthEndurance = dto.strengthEndurance ?? null;
    if (dto.concentrationSharpness !== undefined) log.concentrationSharpness = dto.concentrationSharpness ?? null;
    if (dto.bodyComposition !== undefined) log.bodyComposition = dto.bodyComposition ?? null;
    if (dto.sleepQuality !== undefined) log.sleepQuality = dto.sleepQuality ?? null;
    if (dto.exerciseDurationMinutes !== undefined) log.exerciseDurationMinutes = dto.exerciseDurationMinutes ?? null;
    if (dto.exerciseIntensity !== undefined) log.exerciseIntensity = dto.exerciseIntensity?.trim() || null;
    if (dto.sleepHours !== undefined) log.sleepHours = dto.sleepHours ?? null;
    if (dto.stressLevel !== undefined) log.stressLevel = dto.stressLevel ?? null;
    if (dto.weightLbs !== undefined) log.weightLbs = dto.weightLbs ?? null;

    const saved = await this.logsRepo.save(log);
    return this.mapLog(saved);
  }

  async remove(userId: string, role: string, id: string, hasCustomerProfile = false): Promise<void> {
    if (role !== 'customer' && !hasCustomerProfile) {
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
    const toNullableNumber = (value: number | string | null | undefined) =>
      value === null || value === undefined ? null : Number(value);

    return {
      id: log.id,
      logType: log.logType ?? 'monthly',
      testosteroneLevel: toNullableNumber(log.testosteroneNgDl),
      estradiolLevel: toNullableNumber(log.estradiolPgMl),
      doseMg: toNullableNumber(log.doseMg),
      formFactor: log.formFactor ?? null,
      dateTaken: log.dateTaken.toISOString(),
      moodScore: log.moodScore ?? null,
      moodNotes: log.moodNotes ?? null,
      erectionStrength: log.erectionStrength ?? null,
      morningErections: log.morningErections ?? null,
      libido: log.libido ?? null,
      sexualThoughts: log.sexualThoughts ?? null,
      energyLevels: log.energyLevels ?? null,
      moodStability: log.moodStability ?? null,
      strengthEndurance: log.strengthEndurance ?? null,
      concentrationSharpness: log.concentrationSharpness ?? null,
      bodyComposition: log.bodyComposition ?? null,
      sleepQuality: log.sleepQuality ?? null,
      exerciseDurationMinutes: log.exerciseDurationMinutes ?? null,
      exerciseIntensity: log.exerciseIntensity ?? null,
      sleepHours: toNullableNumber(log.sleepHours),
      stressLevel: log.stressLevel ?? null,
      weightLbs: toNullableNumber(log.weightLbs),
      createdAt: log.createdAt.toISOString(),
    };
  }
}
