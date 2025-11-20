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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const username_generator_1 = require("./username-generator");
let CustomersService = class CustomersService {
    constructor(profilesRepo, favoritesRepo, storesRepo) {
        this.profilesRepo = profilesRepo;
        this.favoritesRepo = favoritesRepo;
        this.storesRepo = storesRepo;
    }
    async createProfile(userId, birthYear) {
        const username = await this.generateUniqueUsername();
        const profile = this.profilesRepo.create({ userId, birthYear, username });
        return this.profilesRepo.save(profile);
    }
    async upsertProfile(userId, birthYear) {
        const existing = await this.profilesRepo.findOne({ where: { userId } });
        if (existing) {
            existing.birthYear = birthYear;
            return this.profilesRepo.save(existing);
        }
        return this.createProfile(userId, birthYear);
    }
    async hasProfile(userId) {
        const count = await this.profilesRepo.count({ where: { userId } });
        return count > 0;
    }
    async findProfile(userId) {
        return this.profilesRepo.findOne({ where: { userId } });
    }
    async requireProfile(userId) {
        const profile = await this.findProfile(userId);
        if (!profile) {
            throw new common_1.NotFoundException('Customer profile not found');
        }
        return profile;
    }
    async listFavoriteStores(userId) {
        const favorites = await this.favoritesRepo.find({
            where: { userId },
            relations: ['store'],
            order: { createdAt: 'DESC' },
        });
        return favorites
            .map((favorite) => favorite.store)
            .filter(Boolean)
            .map((store) => this.mapStore(store));
    }
    async addFavorite(userId, storeId) {
        const store = await this.storesRepo.findOne({ where: { id: storeId, deletedAt: (0, typeorm_2.IsNull)() } });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        const favorite = this.favoritesRepo.create({ userId, storeId });
        try {
            await this.favoritesRepo.insert(favorite);
        }
        catch {
        }
        return this.listFavoriteStores(userId);
    }
    async removeFavorite(userId, storeId) {
        await this.favoritesRepo.delete({ userId, storeId });
        return this.listFavoriteStores(userId);
    }
    async generateUniqueUsername(attempt = 0) {
        const username = (0, username_generator_1.generateUsername)();
        const existing = await this.profilesRepo.findOne({ where: { username } });
        if (!existing) {
            return username;
        }
        if (attempt > 5) {
            return `${username}-${Date.now()}`;
        }
        return this.generateUniqueUsername(attempt + 1);
    }
    mapStore(store) {
        return {
            id: store.id,
            name: store.name,
            city: store.city,
            state: store.state,
            status: store.status,
            slug: store.slug,
            imageUrl: store.imageUrl ?? null,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CustomerProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.FavoriteStore)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Store)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map