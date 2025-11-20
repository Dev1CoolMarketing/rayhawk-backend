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
exports.VendorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const users_service_1 = require("../users/users.service");
let VendorsService = class VendorsService {
    constructor(usersService, vendorsRepo) {
        this.usersService = usersService;
        this.vendorsRepo = vendorsRepo;
    }
    async completeOnboarding(userId, dto) {
        const user = await this.usersService.updateProfile(userId, {
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'vendor',
        });
        let vendor = await this.vendorsRepo.findOne({ where: { ownerId: userId } });
        if (!vendor) {
            vendor = this.vendorsRepo.create({
                ownerId: userId,
                name: dto.vendorName,
                description: dto.vendorDescription ?? null,
                status: 'active',
            });
        }
        else {
            vendor.name = dto.vendorName;
            vendor.description = dto.vendorDescription ?? vendor.description ?? null;
            if (vendor.status !== 'active') {
                vendor.status = 'active';
            }
        }
        const savedVendor = await this.vendorsRepo.save(vendor);
        return {
            user,
            vendor: savedVendor,
        };
    }
};
exports.VendorsService = VendorsService;
exports.VendorsService = VendorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Vendor)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        typeorm_2.Repository])
], VendorsService);
//# sourceMappingURL=vendors.service.js.map