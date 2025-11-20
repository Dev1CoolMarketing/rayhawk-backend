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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_module_1 = require("../../infra/bullmq.module");
const reports_service_1 = require("../reports/reports.service");
let JobsService = JobsService_1 = class JobsService {
    constructor(reportsQueue, reportsService) {
        this.reportsQueue = reportsQueue;
        this.reportsService = reportsService;
        this.logger = new common_1.Logger(JobsService_1.name);
    }
    async enqueueDailySummary(accountId) {
        if (!this.reportsQueue) {
            this.logger.warn('Reports queue disabled (no REDIS_URL); skipping enqueueDailySummary call');
            return;
        }
        const summary = await this.reportsService.dailySummary(accountId);
        return this.reportsQueue.add('daily-summary', { accountId: accountId ?? null, summary }, { removeOnComplete: true, removeOnFail: true });
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(bullmq_module_1.REPORTS_QUEUE)),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, reports_service_1.ReportsService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map