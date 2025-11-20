"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const jwt_strategy_1 = require("../strategies/jwt.strategy");
describe('JwtStrategy', () => {
    const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
        tokenVersion: 0,
    };
    const createStrategy = (overrides) => {
        const config = {
            get: jest.fn().mockReturnValue('secret'),
        };
        const usersService = {
            findById: jest.fn().mockResolvedValue(user),
            ...overrides,
        };
        return { strategy: new jwt_strategy_1.JwtStrategy(config, usersService), usersService };
    };
    it('returns a sanitized request user when payload is valid', async () => {
        const { strategy } = createStrategy();
        const result = await strategy.validate({
            sub: 'user-1',
            email: 'test@example.com',
            role: 'user',
            tv: 0,
        });
        expect(result).toEqual({
            id: 'user-1',
            email: 'test@example.com',
            role: 'user',
            tokenVersion: 0,
        });
    });
    it('throws when token version no longer matches', async () => {
        const overrides = {
            findById: jest.fn().mockResolvedValue({ ...user, tokenVersion: 1 }),
        };
        const { strategy } = createStrategy(overrides);
        await expect(strategy.validate({
            sub: 'user-1',
            email: 'test@example.com',
            role: 'user',
            tv: 0,
        })).rejects.toThrow(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=jwt.strategy.spec.js.map