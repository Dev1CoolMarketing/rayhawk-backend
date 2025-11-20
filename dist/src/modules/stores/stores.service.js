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
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const media_service_1 = require("../media/media.service");
let StoresService = class StoresService {
    constructor(storesRepository, productsRepository, vendorsRepository, media) {
        this.storesRepository = storesRepository;
        this.productsRepository = productsRepository;
        this.vendorsRepository = vendorsRepository;
        this.media = media;
    }
    findActive() {
        return this.storesRepository.find({ where: { status: 'active', deletedAt: (0, typeorm_2.IsNull)() } });
    }
    findExisting() {
        return this.storesRepository.find({ where: { deletedAt: (0, typeorm_2.IsNull)() } });
    }
    async findMine(ownerId) {
        const vendor = await this.vendorsRepository.findOne({ where: { ownerId } });
        if (!vendor) {
            return [];
        }
        return this.storesRepository.find({ where: { vendorId: vendor.id, deletedAt: (0, typeorm_2.IsNull)() } });
    }
    async findOne(id) {
        const store = await this.storesRepository.findOne({ where: { id, deletedAt: (0, typeorm_2.IsNull)() } });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        return store;
    }
    async create(dto, ownerId) {
        const vendor = await this.requireVendor(ownerId);
        const store = this.storesRepository.create({
            ...dto,
            vendorId: vendor.id,
            openingHours: dto.openingHours ?? null,
            description: dto.description ?? null,
        });
        try {
            return await this.storesRepository.save(store);
        }
        catch (error) {
            this.handleSlugCollision(error);
        }
    }
    async update(id, ownerId, dto) {
        const store = await this.requireOwnedStore(id, ownerId);
        if (dto.name !== undefined) {
            store.name = dto.name;
        }
        if (dto.slug !== undefined) {
            store.slug = dto.slug;
        }
        if (dto.description !== undefined) {
            store.description = dto.description.trim().length ? dto.description : null;
        }
        if (dto.addressLine1 !== undefined) {
            store.addressLine1 = dto.addressLine1;
        }
        if (dto.addressLine2 !== undefined) {
            store.addressLine2 = dto.addressLine2.trim().length ? dto.addressLine2 : null;
        }
        if (dto.city !== undefined) {
            store.city = dto.city;
        }
        if (dto.state !== undefined) {
            store.state = dto.state;
        }
        if (dto.postalCode !== undefined) {
            store.postalCode = dto.postalCode;
        }
        if (dto.status !== undefined) {
            store.status = dto.status;
        }
        if (dto.openingHours !== undefined) {
            const normalized = dto.openingHours.map((line) => line.trim()).filter((line) => line.length > 0);
            store.openingHours = normalized.length ? normalized : null;
        }
        try {
            return await this.storesRepository.save(store);
        }
        catch (error) {
            this.handleSlugCollision(error);
        }
    }
    async updateImage(storeId, ownerId, image) {
        const store = await this.requireOwnedStore(storeId, ownerId);
        await this.media.deleteImage(store.imagePublicId, store.imageUrl);
        store.imageUrl = image.url;
        store.imagePublicId = image.publicId;
        return this.storesRepository.save(store);
    }
    async remove(id, ownerId) {
        const store = await this.requireOwnedStore(id, ownerId);
        const products = await this.productsRepository.find({ where: { storeId: store.id } });
        await Promise.all(products.map(async (product) => {
            await this.media.deleteImage(product.imagePublicId, product.imageUrl);
        }));
        if (products.length) {
            await this.productsRepository.softRemove(products);
        }
        await this.media.deleteImage(store.imagePublicId, store.imageUrl);
        return this.storesRepository.softRemove(store);
    }
    async requireOwnedStore(id, ownerId) {
        const store = await this.storesRepository.findOne({ where: { id }, relations: ['vendor'] });
        if (!store || store.deletedAt) {
            throw new common_1.NotFoundException('Store not found');
        }
        if (!store.vendor || store.vendor.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to manage this store');
        }
        return store;
    }
    async requireVendor(ownerId) {
        const vendor = await this.vendorsRepository.findOne({ where: { ownerId } });
        if (!vendor) {
            throw new common_1.ForbiddenException('Vendor onboarding required before managing stores');
        }
        if (vendor.status !== 'active') {
            throw new common_1.ForbiddenException('Vendor account is not active');
        }
        return vendor;
    }
    handleSlugCollision(error) {
        const isQueryError = error instanceof typeorm_2.QueryFailedError;
        if (isQueryError &&
            (error.driverError?.code === '23505' || error.driverError?.routine === '_bt_check_unique') &&
            error.driverError?.constraint === 'IDX_790b2968701a6ff5ff38323776') {
            throw new common_1.ConflictException('Store slug already in use. Try a different slug.');
        }
        throw error;
    }
};
exports.StoresService = StoresService;
exports.StoresService = StoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Store)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        media_service_1.MediaService])
], StoresService);
//# sourceMappingURL=stores.service.js.map