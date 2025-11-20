"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const entities_1 = require("../../../entities");
const users_service_1 = require("../../users/users.service");
const auth_service_1 = require("../auth.service");
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));
const mockConfig = {
    get: jest.fn((key) => {
        switch (key) {
            case 'JWT_ACCESS_TOKEN_SECRET':
                return 'access-secret';
            case 'JWT_REFRESH_TOKEN_SECRET':
                return 'refresh-secret';
            case 'JWT_ACCESS_TOKEN_TTL_SECONDS':
                return '600';
            case 'JWT_REFRESH_TOKEN_TTL_SECONDS':
                return '604800';
            default:
                return undefined;
        }
    }),
};
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    let refreshRepo;
    const userFactory = () => ({
        id: 'user-1',
        email: 'person@example.com',
        passwordHash: 'hashed-password',
        role: 'user',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: users_service_1.UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                        findById: jest.fn(),
                        incrementTokenVersion: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                        verifyAsync: jest.fn(),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfig,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(entities_1.RefreshToken),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
        refreshRepo = module.get((0, typeorm_1.getRepositoryToken)(entities_1.RefreshToken));
        jest.clearAllMocks();
    });
    it('registers a new user and returns tokens', async () => {
        const user = userFactory();
        usersService.findByEmail?.mockResolvedValue(null);
        usersService.create?.mockResolvedValue(user);
        jwtService.signAsync?.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
        refreshRepo.create?.mockImplementation((entity) => entity);
        const result = await service.register({ email: 'person@example.com', password: 'Password1!' });
        expect(usersService.create).toHaveBeenCalled();
        expect(result).toMatchObject({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: {
                id: user.id,
                email: user.email,
            },
        });
        expect(refreshRepo.save).toHaveBeenCalledTimes(1);
    });
    it('rejects duplicate registrations', async () => {
        usersService.findByEmail?.mockResolvedValue(userFactory());
        await expect(service.register({ email: 'person@example.com', password: 'Password1!' })).rejects.toThrow(common_1.ConflictException);
    });
    it('refreshes a session and rotates tokens', async () => {
        const user = userFactory();
        const incomingRefresh = 'refresh-token';
        const hashed = (0, crypto_1.createHash)('sha256').update(incomingRefresh).digest('hex');
        jwtService.verifyAsync?.mockResolvedValue({ sub: user.id, tv: user.tokenVersion, type: 'refresh' });
        refreshRepo.findOne?.mockResolvedValue({
            tokenHash: hashed,
            expiresAt: new Date(Date.now() + 10000),
            revokedAt: null,
            user,
        });
        refreshRepo.create?.mockImplementation((entity) => entity);
        jwtService.signAsync
            ?.mockResolvedValueOnce('new-access-token')
            .mockResolvedValueOnce('new-refresh-token');
        const result = await service.refresh(incomingRefresh);
        expect(result.accessToken).toEqual('new-access-token');
        expect(result.refreshToken).toEqual('new-refresh-token');
        expect(refreshRepo.save).toHaveBeenCalledTimes(2);
    });
    it('validates user credentials', async () => {
        const user = userFactory();
        usersService.findByEmail?.mockResolvedValue(user);
        const result = await service.validateUser(user.email, 'password');
        expect(result.id).toEqual(user.id);
    });
    it('throws when credentials are invalid', async () => {
        usersService.findByEmail?.mockResolvedValue(null);
        await expect(service.validateUser('missing@example.com', 'password')).rejects.toThrow(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=auth.service.spec.js.map