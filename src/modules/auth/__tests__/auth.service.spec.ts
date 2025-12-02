import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { RefreshToken, User, Vendor } from '../../../entities';
import { UsersService } from '../../users/users.service';
import { CustomersService } from '../../customers/customers.service';
import { AuthService } from '../auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};

const mockConfig = {
  get: jest.fn((key: string) => {
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
  let service: AuthService;
  let usersService: MockType<UsersService>;
  let jwtService: MockType<JwtService>;
  let refreshRepo: MockType<Repository<RefreshToken>>;

  const userFactory = (): User =>
    ({
      id: 'user-1',
      email: 'person@example.com',
      passwordHash: 'hashed-password',
      role: 'user',
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            incrementTokenVersion: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Vendor),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: CustomersService,
          useValue: {
            createProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshRepo = module.get(getRepositoryToken(RefreshToken));

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
    await expect(
      service.register({ email: 'person@example.com', password: 'Password1!' }),
    ).rejects.toThrow(ConflictException);
  });

  it('refreshes a session and rotates tokens', async () => {
    const user = userFactory();
    const incomingRefresh = 'refresh-token';
    const hashed = createHash('sha256').update(incomingRefresh).digest('hex');

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
    await expect(service.validateUser('missing@example.com', 'password')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
