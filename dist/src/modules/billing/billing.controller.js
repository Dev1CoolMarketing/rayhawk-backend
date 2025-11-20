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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const stripe_1 = __importDefault(require("stripe"));
const user_decorator_1 = require("../../common/decorators/user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const checkout_dto_1 = require("./dto/checkout.dto");
let BillingController = class BillingController {
    constructor(config) {
        this.config = config;
        const secret = config.get('STRIPE_SECRET_KEY');
        this.appUrl = config.get('APP_URL') ?? 'http://localhost:8080';
        if (secret) {
            this.stripe = new stripe_1.default(secret, { apiVersion: '2024-04-10' });
        }
    }
    async checkout(dto, user) {
        if (!this.stripe) {
            return { url: `${this.appUrl}/billing/configure-stripe` };
        }
        if (dto.mode === checkout_dto_1.CheckoutMode.Subscription && !dto.priceId) {
            throw new common_1.BadRequestException('priceId is required for subscription mode');
        }
        if (dto.mode === checkout_dto_1.CheckoutMode.Payment && !dto.amount) {
            throw new common_1.BadRequestException('amount is required for payment mode');
        }
        const session = await this.stripe.checkout.sessions.create({
            mode: dto.mode,
            success_url: `${this.appUrl}/billing/success`,
            cancel_url: `${this.appUrl}/billing/cancel`,
            line_items: dto.mode === checkout_dto_1.CheckoutMode.Subscription
                ? [
                    {
                        price: dto.priceId,
                        quantity: 1,
                    },
                ]
                : [
                    {
                        price_data: {
                            currency: 'usd',
                            unit_amount: Math.round((dto.amount ?? 0) * 100),
                            product_data: {
                                name: 'One-time charge',
                            },
                        },
                        quantity: 1,
                    },
                ],
            metadata: {
                vendorId: dto.vendorId ?? '',
                accountId: user.id,
            },
        });
        return { url: session.url };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkout_dto_1.CheckoutDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "checkout", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)('Billing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map