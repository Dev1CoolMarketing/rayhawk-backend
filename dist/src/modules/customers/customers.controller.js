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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const customers_service_1 = require("./customers.service");
const create_customer_profile_dto_1 = require("./dto/create-customer-profile.dto");
let CustomersController = class CustomersController {
    constructor(customers) {
        this.customers = customers;
    }
    async getMe(user) {
        this.ensureCustomer(user);
        const profile = await this.customers.requireProfile(user.id);
        const favorites = await this.customers.listFavoriteStores(user.id);
        return {
            profile: {
                username: profile.username,
                birthYear: profile.birthYear,
                createdAt: profile.createdAt.toISOString(),
                updatedAt: profile.updatedAt.toISOString(),
            },
            favorites,
        };
    }
    addFavorite(user, storeId) {
        this.ensureCustomer(user);
        return this.customers.addFavorite(user.id, storeId);
    }
    removeFavorite(user, storeId) {
        this.ensureCustomer(user);
        return this.customers.removeFavorite(user.id, storeId);
    }
    async createProfile(user, dto) {
        const profile = await this.customers.upsertProfile(user.id, dto.birthYear);
        return {
            username: profile.username,
            birthYear: profile.birthYear,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }
    ensureCustomer(user) {
        if (user.role !== 'customer' && !user.hasCustomerProfile) {
            throw new common_1.ForbiddenException('Customer access required');
        }
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('me/favorites/:storeId'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Param)('storeId', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "addFavorite", null);
__decorate([
    (0, common_1.Delete)('me/favorites/:storeId'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Param)('storeId', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "removeFavorite", null);
__decorate([
    (0, common_1.Post)('me/profile'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_customer_profile_dto_1.CreateCustomerProfileDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createProfile", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('Customers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map