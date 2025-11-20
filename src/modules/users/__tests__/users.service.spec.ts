import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities';
import { UsersService } from '../users.service';

type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockType<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('finds a user by email', async () => {
    const user = { id: '123', email: 'test@example.com' } as User;
    repo.findOne?.mockResolvedValue(user);

    const result = await service.findByEmail('test@example.com');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(result).toEqual(user);
  });

  it('creates a new user with hashed password', async () => {
    const created = { email: 'test@example.com', passwordHash: 'hash', role: 'user' } as User;
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
