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
exports.Store = void 0;
const typeorm_1 = require("typeorm");
const favorite_store_entity_1 = require("./favorite-store.entity");
const product_entity_1 = require("./product.entity");
const vendor_entity_1 = require("./vendor.entity");
let Store = class Store {
};
exports.Store = Store;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Store.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_id', type: 'uuid' }),
    __metadata("design:type", String)
], Store.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, (vendor) => vendor.stores, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], Store.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Store.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Store.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'active' }),
    __metadata("design:type", String)
], Store.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_line1', type: 'text' }),
    __metadata("design:type", String)
], Store.prototype, "addressLine1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address_line2', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "addressLine2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Store.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Store.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'postal_code', type: 'text' }),
    __metadata("design:type", String)
], Store.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_public_id', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "imagePublicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'opening_hours', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "openingHours", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Store.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Store.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Store.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => favorite_store_entity_1.FavoriteStore, (favorite) => favorite.store),
    __metadata("design:type", Array)
], Store.prototype, "favorites", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_entity_1.Product, (product) => product.store),
    __metadata("design:type", Array)
], Store.prototype, "products", void 0);
exports.Store = Store = __decorate([
    (0, typeorm_1.Entity)({ name: 'stores', schema: 'core' })
], Store);
//# sourceMappingURL=store.entity.js.map