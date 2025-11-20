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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const typeorm_1 = require("typeorm");
const vendor_entity_1 = require("./vendor.entity");
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, (vendor) => vendor.subscriptions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], Subscription.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_id', type: 'uuid' }),
    __metadata("design:type", String)
], Subscription.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_customer_id', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "stripeCustomerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_subscription_id', type: 'text', nullable: true, unique: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "stripeSubscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'inactive' }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_end', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Subscription.prototype, "createdAt", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)({ name: 'subscriptions', schema: 'core' })
], Subscription);
//# sourceMappingURL=subscription.entity.js.map