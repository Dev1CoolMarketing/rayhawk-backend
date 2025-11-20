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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt_1 = require("bcrypt");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../entities");
const users_service_1 = require("../users/users.service");
const auth_mapper_1 = require("./auth.mapper");
const role_utils_1 = require("./utils/role.utils");
const customers_service_1 = require("../customers/customers.service");
const customer_profile_required_exception_1 = require("./exceptions/customer-profile-required.exception");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwt, config, refreshTokenRepo, vendorsRepo, customersService) {
        this.usersService = usersService;
        this.jwt = jwt;
        this.config = config;
        this.refreshTokenRepo = refreshTokenRepo;
        this.vendorsRepo = vendorsRepo;
        this.customersService = customersService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.saltRounds = 12;
    }
    async register(dto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const passwordHash = await (0, bcrypt_1.hash)(dto.password, this.saltRounds);
        const user = await this.usersService.create(normalizedEmail, passwordHash);
        return this.issueTokens(user);
    }
    async registerCustomer(dto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const existingUser = await this.usersService.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const passwordHash = await (0, bcrypt_1.hash)(dto.password, this.saltRounds);
        const user = await this.usersService.create(normalizedEmail, passwordHash, 'customer');
        await this.customersService.createProfile(user.id, dto.birthYear);
        const hydrated = await this.usersService.findById(user.id);
        if (!hydrated) {
            throw new common_1.NotFoundException('User not found after registration');
        }
        return this.issueTokens(hydrated);
    }
    async login(user, audience) {
        return this.issueTokens(user, { requestedRole: audience ?? null });
    }
    async getCurrentUser(userId, activeRole) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapUserWithVendor(user, activeRole);
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new common_1.BadRequestException('Refresh token is required');
        }
        const payload = await this.verifyRefreshToken(refreshToken);
        const storedToken = await this.refreshTokenRepo.findOne({
            where: { tokenHash: this.hashToken(refreshToken) },
            relations: ['user'],
        });
        if (!storedToken || storedToken.revokedAt) {
            throw new common_1.UnauthorizedException('Refresh token has been revoked');
        }
        if (storedToken.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('Refresh token has expired');
        }
        const user = storedToken.user;
        if (!user || user.tokenVersion !== payload.tv) {
            throw new common_1.UnauthorizedException('Refresh token no longer valid');
        }
        storedToken.revokedAt = new Date();
        await this.refreshTokenRepo.save(storedToken);
        return this.issueTokens(user);
    }
    async logout(refreshToken, userId) {
        if (!refreshToken) {
            throw new common_1.BadRequestException('Refresh token is required');
        }
        const payload = await this.verifyRefreshToken(refreshToken);
        if (payload.sub !== userId) {
            throw new common_1.UnauthorizedException('Refresh token does not belong to this user');
        }
        const tokenHash = this.hashToken(refreshToken);
        const storedToken = await this.refreshTokenRepo.findOne({
            where: { tokenHash },
            relations: ['user'],
        });
        if (storedToken && storedToken.user.id !== userId) {
            throw new common_1.UnauthorizedException('Refresh token does not belong to this user');
        }
        if (storedToken && !storedToken.revokedAt) {
            storedToken.revokedAt = new Date();
            await this.refreshTokenRepo.save(storedToken);
        }
        return { success: true };
    }
    async validateUser(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalizedEmail);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordMatches = await (0, bcrypt_1.compare)(password, user.passwordHash);
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    async issueTokens(user, options) {
        await this.cleanupExpiredTokens(user.id);
        const accessTtlSeconds = this.getAccessTokenTtlSeconds();
        const refreshTtlSeconds = this.getRefreshTokenTtlSeconds();
        const activeRole = this.resolveActiveRole(user, options?.requestedRole ?? null);
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(this.buildAccessPayload(user, activeRole), {
                secret: this.getAccessTokenSecret(),
                expiresIn: accessTtlSeconds,
            }),
            this.jwt.signAsync(this.buildRefreshPayload(user, activeRole), {
                secret: this.getRefreshTokenSecret(),
                expiresIn: refreshTtlSeconds,
            }),
        ]);
        await this.persistRefreshToken(user, refreshToken, refreshTtlSeconds);
        const authUser = await this.mapUserWithVendor(user, activeRole);
        return {
            accessToken,
            refreshToken,
            accessTokenExpiresIn: accessTtlSeconds,
            refreshTokenExpiresIn: refreshTtlSeconds,
            user: authUser,
        };
    }
    async persistRefreshToken(user, refreshToken, ttlSeconds) {
        const entity = this.refreshTokenRepo.create({
            user,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        });
        await this.refreshTokenRepo.save(entity);
    }
    async cleanupExpiredTokens(userId) {
        try {
            await this.refreshTokenRepo.delete({
                user: { id: userId },
                expiresAt: (0, typeorm_2.LessThan)(new Date()),
            });
        }
        catch (error) {
            this.logger.warn(`Failed to cleanup refresh tokens for user ${userId}: ${error.message}`);
        }
    }
    async verifyRefreshToken(token) {
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.getRefreshTokenSecret(),
            });
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            return payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    buildAccessPayload(user, roleOverride) {
        return {
            sub: user.id,
            email: user.email,
            role: roleOverride ?? user.role,
            tv: user.tokenVersion,
        };
    }
    buildRefreshPayload(user, roleOverride) {
        return {
            sub: user.id,
            tv: user.tokenVersion,
            type: 'refresh',
            role: roleOverride ?? user.role,
        };
    }
    async mapUserWithVendor(user, roleOverride) {
        const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
        return (0, auth_mapper_1.mapUserToAuthUserDto)(user, vendor, user.customerProfile ?? null, roleOverride);
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    getAccessTokenSecret() {
        const secret = this.config.get('JWT_ACCESS_TOKEN_SECRET');
        if (!secret) {
            throw new Error('JWT_ACCESS_TOKEN_SECRET is not configured');
        }
        return secret;
    }
    getRefreshTokenSecret() {
        const secret = this.config.get('JWT_REFRESH_TOKEN_SECRET');
        if (!secret) {
            throw new Error('JWT_REFRESH_TOKEN_SECRET is not configured');
        }
        return secret;
    }
    getAccessTokenTtlSeconds() {
        return this.parseDurationSeconds(this.config.get('JWT_ACCESS_TOKEN_TTL_SECONDS'), 900);
    }
    getRefreshTokenTtlSeconds() {
        return this.parseDurationSeconds(this.config.get('JWT_REFRESH_TOKEN_TTL_SECONDS'), 60 * 60 * 24 * 14);
    }
    parseDurationSeconds(value, fallback) {
        if (!value) {
            return fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }
    resolveActiveRole(user, requestedRole) {
        if (!requestedRole) {
            return user.role;
        }
        const allowedRoles = (0, role_utils_1.getAssignableRoles)(user);
        if (!allowedRoles.has(requestedRole)) {
            if (requestedRole === 'customer') {
                throw new customer_profile_required_exception_1.CustomerProfileRequiredException();
            }
            throw new common_1.UnauthorizedException(`User cannot authenticate as ${requestedRole}`);
        }
        return requestedRole;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.RefreshToken)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Vendor)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        customers_service_1.CustomersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map