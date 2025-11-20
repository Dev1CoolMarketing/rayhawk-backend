"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullMqModule = exports.REPORTS_QUEUE = exports.QUEUES = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.QUEUES = {
    EMAIL: 'email',
    REPORTS: 'reports',
};
exports.REPORTS_QUEUE = Symbol('REPORTS_QUEUE');
const REPORTS_WORKER = Symbol('REPORTS_WORKER');
const createConnection = (url) => new ioredis_1.default(url, {
    maxRetriesPerRequest: null,
});
const isRedisConfigured = (url) => {
    const normalized = url?.trim().toLowerCase();
    if (!normalized) {
        return false;
    }
    return !['disabled', 'disable', 'off', 'false', '0', 'none'].includes(normalized);
};
let BullMqModule = class BullMqModule {
    constructor(queue, worker) {
        this.queue = queue;
        this.worker = worker;
    }
    async onModuleDestroy() {
        const closers = [];
        if (this.queue) {
            closers.push(this.queue.close());
        }
        if (this.worker) {
            closers.push(this.worker.close());
        }
        await Promise.all(closers);
    }
};
exports.BullMqModule = BullMqModule;
exports.BullMqModule = BullMqModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: exports.REPORTS_QUEUE,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    if (!isRedisConfigured(redisUrl)) {
                        new common_1.Logger('BullMqModule').warn('REDIS_URL not configured; BullMQ queue disabled');
                        return null;
                    }
                    return new bullmq_1.Queue(exports.QUEUES.REPORTS, {
                        connection: createConnection(redisUrl),
                    });
                },
            },
            {
                provide: REPORTS_WORKER,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    if (!isRedisConfigured(redisUrl)) {
                        return null;
                    }
                    const logger = new common_1.Logger('ReportsWorker');
                    const worker = new bullmq_1.Worker(exports.QUEUES.REPORTS, async (job) => {
                        logger.log(`Processing job ${job.name} (${job.id})`);
                        if (job.name === 'daily-summary') {
                            logger.log(`Summary payload: ${JSON.stringify(job.data?.summary ?? {})}`);
                        }
                    }, {
                        connection: createConnection(redisUrl),
                    });
                    worker.on('failed', (job, err) => {
                        logger.error(`Job ${job?.id} failed`, err.stack);
                    });
                    return worker;
                },
            },
        ],
        exports: [exports.REPORTS_QUEUE],
    }),
    __param(0, (0, common_1.Inject)(exports.REPORTS_QUEUE)),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(REPORTS_WORKER)),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object])
], BullMqModule);
//# sourceMappingURL=bullmq.module.js.map