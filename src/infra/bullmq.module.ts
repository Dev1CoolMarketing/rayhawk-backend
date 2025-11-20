import { Inject, Logger, Module, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

export const QUEUES = {
  EMAIL: 'email',
  REPORTS: 'reports',
} as const;

export const REPORTS_QUEUE = Symbol('REPORTS_QUEUE');
const REPORTS_WORKER = Symbol('REPORTS_WORKER');

const createConnection = (url: string) =>
  new Redis(url, {
    maxRetriesPerRequest: null,
  });

const isRedisConfigured = (url?: string | null) => {
  const normalized = url?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return !['disabled', 'disable', 'off', 'false', '0', 'none'].includes(normalized);
};

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REPORTS_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!isRedisConfigured(redisUrl)) {
          new Logger('BullMqModule').warn('REDIS_URL not configured; BullMQ queue disabled');
          return null;
        }
        return new Queue(QUEUES.REPORTS, {
          connection: createConnection(redisUrl as string),
        });
      },
    },
    {
      provide: REPORTS_WORKER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!isRedisConfigured(redisUrl)) {
          return null;
        }
        const logger = new Logger('ReportsWorker');
        const worker = new Worker(
          QUEUES.REPORTS,
          async (job) => {
            logger.log(`Processing job ${job.name} (${job.id})`);
            if (job.name === 'daily-summary') {
              logger.log(`Summary payload: ${JSON.stringify(job.data?.summary ?? {})}`);
            }
          },
          {
            connection: createConnection(redisUrl as string),
          },
        );
        worker.on('failed', (job, err) => {
          logger.error(`Job ${job?.id} failed`, err.stack);
        });
        return worker;
      },
    },
  ],
  exports: [REPORTS_QUEUE],
})
export class BullMqModule implements OnModuleDestroy {
  constructor(
    @Inject(REPORTS_QUEUE) @Optional() private readonly queue: Queue | null,
    @Inject(REPORTS_WORKER) @Optional() private readonly worker: Worker | null,
  ) {}

  async onModuleDestroy() {
    const closers: Promise<unknown>[] = [];
    if (this.queue) {
      closers.push(this.queue.close());
    }
    if (this.worker) {
      closers.push(this.worker.close());
    }
    await Promise.all(closers);
  }
}
