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
exports.Vendor = void 0;
const typeorm_1 = require("typeorm");
const subscription_entity_1 = require("./subscription.entity");
const store_entity_1 = require("./store.entity");
let Vendor = class Vendor {
};
exports.Vendor = Vendor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Vendor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    __metadata("design:type", String)
], Vendor.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Vendor.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_account_id', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Vendor.prototype, "stripeAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'inactive' }),
    __metadata("design:type", String)
], Vendor.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Vendor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subscription_entity_1.Subscription, (subscription) => subscription.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "subscriptions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => store_entity_1.Store, (store) => store.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "stores", void 0);
exports.Vendor = Vendor = __decorate([
    (0, typeorm_1.Entity)({ name: 'vendors', schema: 'core' })
], Vendor);
//# sourceMappingURL=vendor.entity.js.map