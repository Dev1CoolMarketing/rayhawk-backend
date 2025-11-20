import { Repository } from 'typeorm';
import { Store } from '../../entities';
export declare class ReportsService {
    private readonly storesRepository;
    constructor(storesRepository: Repository<Store>);
    dailySummary(accountId?: string): Promise<{
        scope: string;
        storeCount: number;
        generatedAt: string;
    }>;
}
