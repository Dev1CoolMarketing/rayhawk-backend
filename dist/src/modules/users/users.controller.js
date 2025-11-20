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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const users_service_1 = require("./users.service");
const media_service_1 = require("../media/media.service");
const update_avatar_dto_1 = require("./dto/update-avatar.dto");
let UsersController = class UsersController {
    constructor(usersService, media) {
        this.usersService = usersService;
        this.media = media;
    }
    async updateAvatar(dto, user) {
        const existing = await this.usersService.findById(user.id);
        if (!existing) {
            throw new Error('User not found');
        }
        const upload = await this.media.uploadBase64Image(dto.file, `users/${user.id}`);
        await this.media.deleteImage(existing.avatarPublicId, existing.avatarUrl);
        const updated = await this.usersService.updateProfile(user.id, {
            avatarUrl: upload.url,
            avatarPublicId: upload.publicId,
        });
        return updated;
    }
    async deleteAccount(user) {
        const existing = await this.usersService.findById(user.id);
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.media.deleteImage(existing.avatarPublicId, existing.avatarUrl);
        await this.usersService.deleteById(existing.id);
        return { success: true };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Patch)('me/avatar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_avatar_dto_1.UpdateAvatarDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateAvatar", null);
__decorate([
    (0, common_1.Delete)('me'),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService, media_service_1.MediaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map