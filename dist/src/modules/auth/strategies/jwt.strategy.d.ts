import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../types/jwt-payload.interface';
import { RequestUser } from '../types/request-user.interface';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly config;
    private readonly usersService;
    constructor(config: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<RequestUser>;
}
export {};
