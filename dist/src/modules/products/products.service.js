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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const media_service_1 = require("../media/media.service");
let ProductsService = class ProductsService {
    constructor(productsRepository, storesRepository, media) {
        this.productsRepository = productsRepository;
        this.storesRepository = storesRepository;
        this.media = media;
    }
    findByStore(storeId) {
        return this.productsRepository.find({
            where: { storeId, status: 'active', deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(storeId, productId) {
        const product = await this.productsRepository.findOne({
            where: { id: productId, storeId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async create(storeId, dto, requesterId) {
        const store = await this.storesRepository.findOne({
            where: { id: storeId, deletedAt: (0, typeorm_2.IsNull)() },
            relations: ['vendor'],
        });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        if (!store.vendor || store.vendor.ownerId !== requesterId) {
            throw new common_1.ForbiddenException('You do not have permission to manage this store');
        }
        const product = this.productsRepository.create({
            ...dto,
            status: dto.status ?? 'active',
            linkUrl: dto.linkUrl ?? null,
            storeId,
        });
        return this.productsRepository.save(product);
    }
    async updateImage(storeId, productId, ownerId, image) {
        const product = await this.productsRepository.findOne({
            where: { id: productId, storeId },
            relations: ['store', 'store.vendor'],
        });
        if (!product || product.deletedAt || product.store?.deletedAt) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (!product.store?.vendor || product.store.vendor.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to update this product');
        }
        await this.media.deleteImage(product.imagePublicId, product.imageUrl);
        product.imageUrl = image.url;
        product.imagePublicId = image.publicId;
        return this.productsRepository.save(product);
    }
    async update(storeId, productId, ownerId, dto) {
        const product = await this.productsRepository.findOne({
            where: { id: productId, storeId },
            relations: ['store', 'store.vendor'],
        });
        if (!product || product.deletedAt || product.store?.deletedAt) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (!product.store?.vendor || product.store.vendor.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to update this product');
        }
        if (dto.name !== undefined) {
            product.name = dto.name;
        }
        if (dto.description !== undefined) {
            product.description = dto.description ?? null;
        }
        if (dto.priceCents !== undefined) {
            product.priceCents = dto.priceCents;
        }
        if (dto.status !== undefined) {
            product.status = dto.status;
        }
        if (dto.linkUrl !== undefined) {
            product.linkUrl = dto.linkUrl ?? null;
        }
        return this.productsRepository.save(product);
    }
    async remove(storeId, productId, ownerId) {
        const product = await this.productsRepository.findOne({
            where: { id: productId, storeId },
            relations: ['store', 'store.vendor'],
        });
        if (!product || product.deletedAt || product.store?.deletedAt) {
            throw new common_1.NotFoundException('Product not found');
        }
        if (!product.store?.vendor || product.store.vendor.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to update this product');
        }
        await this.media.deleteImage(product.imagePublicId, product.imageUrl);
        return this.productsRepository.softRemove(product);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Store)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        media_service_1.MediaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map