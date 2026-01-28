import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller('cron')
export class JobsController {
  constructor(private readonly jobsService: JobsService, private readonly config: ConfigService) {}

  @Post('enqueue-daily')
  @ApiHeader({ name: 'x-internal-token', required: true, description: 'Shared secret for pg_cron' })
  async enqueueDaily(@Headers('x-internal-token') rawToken: string | string[], @Body('accountId') accountId?: string) {
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
    const expected = this.config.get<string>('INTERNAL_JOBS_TOKEN');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }
    const job = await this.jobsService.enqueueDailySummary(accountId);
    return { enqueued: Boolean(job) };
  }

  @Post('cleanup-retention')
  @ApiHeader({ name: 'x-internal-token', required: true, description: 'Shared secret for pg_cron' })
  async cleanupRetention(@Headers('x-internal-token') rawToken: string | string[]) {
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
    const expected = this.config.get<string>('INTERNAL_JOBS_TOKEN');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }
    return this.jobsService.cleanupRetention();
  }
}
