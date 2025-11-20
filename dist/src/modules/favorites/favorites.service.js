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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
let FavoritesService = class FavoritesService {
    constructor(favoritesRepository, storesRepository) {
        this.favoritesRepository = favoritesRepository;
        this.storesRepository = storesRepository;
    }
    async getMine(userId) {
        return this.storesRepository
            .createQueryBuilder('store')
            .innerJoin('store.favorites', 'favorite', 'favorite.userId = :userId', { userId })
            .where('store.status = :status', { status: 'active' })
            .getMany();
    }
    async add(userId, storeId) {
        const store = await this.storesRepository.findOne({ where: { id: storeId } });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        await this.favoritesRepository.save({ userId, storeId });
        return store;
    }
    async remove(userId, storeId) {
        await this.favoritesRepository.delete({ userId, storeId });
        return { removed: true };
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.FavoriteStore)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Store)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map