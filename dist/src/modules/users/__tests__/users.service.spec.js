"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../../../entities");
const users_service_1 = require("../users.service");
describe('UsersService', () => {
    let service;
    let repo;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(entities_1.User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        increment: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
        repo = module.get((0, typeorm_1.getRepositoryToken)(entities_1.User));
    });
    it('finds a user by email', async () => {
        const user = { id: '123', email: 'test@example.com' };
        repo.findOne?.mockResolvedValue(user);
        const result = await service.findByEmail('test@example.com');
        expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        expect(result).toEqual(user);
    });
    it('creates a new user with hashed password', async () => {
        const created = { email: 'test@example.com', passwordHash: 'hash', role: 'user' };
        repo.create?.mockReturnValue(created);
        repo.save?.mockResolvedValue({ ...created, id: 'user-1' });
        const result = await service.create('test@example.com', 'hash');
        expect(repo.create).toHaveBeenCalledWith({
            email: 'test@example.com',
            passwordHash: 'hash',
            role: 'user',
        });
        expect(repo.save).toHaveBeenCalledWith(created);
        expect(result.id).toEqual('user-1');
    });
    it('increments token version when requested', async () => {
        repo.increment?.mockResolvedValue(undefined);
        await service.incrementTokenVersion('user-1');
        expect(repo.increment).toHaveBeenCalledWith({ id: 'user-1' }, 'tokenVersion', 1);
    });
});
//# sourceMappingURL=users.service.spec.js.map