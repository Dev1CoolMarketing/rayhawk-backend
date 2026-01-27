import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../entities';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from '../strategies/jwt.strategy';

describe('JwtStrategy', () => {
  const user = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    tokenVersion: 0,
  } as User;

  const createStrategy = (overrides?: Partial<UsersService>) => {
    const config = {
      get: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const usersService = {
      findById: jest.fn().mockResolvedValue(user),
      ...overrides,
    } as unknown as UsersService;
    return { strategy: new JwtStrategy(config, usersService), usersService };
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
      hasCustomerProfile: false,
    });
  });

  it('throws when token version no longer matches', async () => {
    const overrides: Partial<UsersService> = {
      findById: jest.fn().mockResolvedValue({ ...user, tokenVersion: 1 }),
    };
    const { strategy } = createStrategy(overrides);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'user',
        tv: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
