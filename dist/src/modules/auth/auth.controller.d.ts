import { Request } from 'express';
import { User as UserEntity } from '../../entities';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { RequestUser } from './types/request-user.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(_req: Request, dto: RegisterUserDto): Promise<TokenResponseDto>;
    registerCustomer(dto: RegisterCustomerDto): Promise<TokenResponseDto>;
    login(dto: LoginUserDto, req: Request & {
        user: UserEntity;
    }): Promise<TokenResponseDto>;
    me(user: RequestUser): Promise<import("./dto/token-response.dto").AuthUserDto>;
    refresh(dto: RefreshTokenDto): Promise<TokenResponseDto>;
    logout(user: RequestUser, dto: RefreshTokenDto): Promise<{
        success: true;
    }>;
}
