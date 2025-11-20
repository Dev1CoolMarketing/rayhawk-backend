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
exports.StripeWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stripe_1 = __importDefault(require("stripe"));
const entities_1 = require("../../entities");
let StripeWebhookController = class StripeWebhookController {
    constructor(config, subscriptionsRepository, leadCreditsRepository) {
        this.config = config;
        this.subscriptionsRepository = subscriptionsRepository;
        this.leadCreditsRepository = leadCreditsRepository;
        const secret = config.get('STRIPE_SECRET_KEY');
        if (secret) {
            this.stripe = new stripe_1.default(secret, { apiVersion: '2024-04-10' });
        }
    }
    async handleStripe(req, signature) {
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        if (!this.stripe || !webhookSecret) {
            return { received: true };
        }
        const resolvedSignature = Array.isArray(signature) ? signature[0] : signature;
        if (!resolvedSignature) {
            throw new common_1.BadRequestException('Missing Stripe signature header');
        }
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new common_1.BadRequestException('Missing raw body in Stripe webhook request');
        }
        const event = this.stripe.webhooks.constructEvent(rawBody, resolvedSignature, webhookSecret);
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await this.syncSubscription(event.data.object);
                break;
            default:
                break;
        }
        return { received: true };
    }
    async handleCheckoutCompleted(session) {
        if (session.mode === 'subscription' && session.subscription) {
            await this.syncSubscription(session.subscription, session);
        }
        else if (session.mode === 'payment') {
            const credits = Number(session.metadata?.credits ?? 10);
            const accountId = session.metadata?.accountId;
            if (accountId) {
                await this.creditLeadAccount(accountId, credits);
            }
        }
    }
    async syncSubscription(subscription, session) {
        if (!this.stripe) {
            return;
        }
        const record = typeof subscription === 'string' ? await this.stripe.subscriptions.retrieve(subscription) : subscription;
        const vendorId = record.metadata?.vendorId ?? session?.metadata?.vendorId;
        if (!vendorId) {
            return;
        }
        await this.subscriptionsRepository.upsert({
            vendorId,
            stripeCustomerId: record.customer ?? session?.customer?.toString(),
            stripeSubscriptionId: record.id,
            status: record.status,
            currentPeriodEnd: record.current_period_end
                ? new Date(record.current_period_end * 1000)
                : undefined,
        }, {
            conflictPaths: ['stripeSubscriptionId'],
        });
    }
    async creditLeadAccount(accountId, credits) {
        await this.leadCreditsRepository.query(`INSERT INTO core.lead_credits(account_id, credits, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (account_id) DO UPDATE
       SET credits = core.lead_credits.credits + EXCLUDED.credits,
           updated_at = now()`, [accountId, credits]);
    }
};
exports.StripeWebhookController = StripeWebhookController;
__decorate([
    (0, common_1.Post)('stripe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StripeWebhookController.prototype, "handleStripe", null);
exports.StripeWebhookController = StripeWebhookController = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Subscription)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.LeadCredit)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StripeWebhookController);
//# sourceMappingURL=stripe.webhook.controller.js.map