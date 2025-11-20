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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const jobs_service_1 = require("./jobs.service");
let JobsController = class JobsController {
    constructor(jobsService, config) {
        this.jobsService = jobsService;
        this.config = config;
    }
    async enqueueDaily(rawToken, accountId) {
        const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
        const expected = this.config.get('INTERNAL_JOBS_TOKEN');
        if (!expected || token !== expected) {
            throw new common_1.UnauthorizedException('Invalid internal token');
        }
        const job = await this.jobsService.enqueueDailySummary(accountId);
        return { enqueued: Boolean(job) };
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Post)('enqueue-daily'),
    (0, swagger_1.ApiHeader)({ name: 'x-internal-token', required: true, description: 'Shared secret for pg_cron' }),
    __param(0, (0, common_1.Headers)('x-internal-token')),
    __param(1, (0, common_1.Body)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "enqueueDaily", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('Jobs'),
    (0, common_1.Controller)('cron'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService, config_1.ConfigService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map