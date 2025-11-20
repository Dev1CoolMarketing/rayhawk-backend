import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../types/jwt-payload.interface';
import { RequestUser } from '../types/request-user.interface';
import { getAssignableRoles } from '../utils/role.utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService, private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });

    if (!config.get<string>('JWT_ACCESS_TOKEN_SECRET')) {
      throw new Error('JWT_ACCESS_TOKEN_SECRET is not configured');
    }
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Access token is no longer valid');
    }
    const allowedRoles = getAssignableRoles(user);
    if (!allowedRoles.has(payload.role)) {
      throw new UnauthorizedException('Access token role is no longer permitted');
    }

    return {
      id: user.id,
      email: user.email,
      role: payload.role,
      tokenVersion: user.tokenVersion,
      hasCustomerProfile: Boolean(user.customerProfile),
    };
  }
}
