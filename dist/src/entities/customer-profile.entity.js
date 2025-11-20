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
exports.CustomerProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let CustomerProfile = class CustomerProfile {
};
exports.CustomerProfile = CustomerProfile;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], CustomerProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.customerProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CustomerProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'username', type: 'text', unique: true }),
    __metadata("design:type", String)
], CustomerProfile.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'birth_year', type: 'int' }),
    __metadata("design:type", Number)
], CustomerProfile.prototype, "birthYear", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CustomerProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], CustomerProfile.prototype, "updatedAt", void 0);
exports.CustomerProfile = CustomerProfile = __decorate([
    (0, typeorm_1.Entity)({ name: 'customer_profiles', schema: 'core' })
], CustomerProfile);
//# sourceMappingURL=customer-profile.entity.js.map