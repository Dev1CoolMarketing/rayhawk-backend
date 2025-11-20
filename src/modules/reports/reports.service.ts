import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../../entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async dailySummary(accountId?: string) {
    const storeCount = await this.storesRepository.count({ where: { status: 'active' } });
    return {
      scope: accountId ?? 'global',
      storeCount,
      generatedAt: new Date().toISOString(),
    };
  }
}
