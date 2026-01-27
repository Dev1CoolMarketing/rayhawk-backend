import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User as CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User as UserEntity } from '../../entities';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RequestUser } from './types/request-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Body: { email, password }
   * Response: TokenResponseDto (access + refresh tokens plus the created user)
   * Errors: 409 if email is taken, 400 on validation errors.
   */
  @Post('register')
  async register(@Req() _req: Request, @Body() dto: RegisterUserDto): Promise<TokenResponseDto> {
    return this.authService.register(dto);
  }

  @Post('customers/register')
  async registerCustomer(@Body() dto: RegisterCustomerDto): Promise<TokenResponseDto> {
    return this.authService.registerCustomer(dto);
  }

  /**
   * POST /auth/login
   * Body: { email, password }
   * Response: TokenResponseDto (access + refresh tokens plus the authenticated user)
   * Errors: 401 on invalid credentials, 400 on validation errors.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() dto: LoginUserDto, @Req() req: Request & { user: UserEntity }): Promise<TokenResponseDto> {
    return this.authService.login(req.user, dto.audience, dto.birthYear);
  }

  /**
   * GET /auth/me
   * Headers: Authorization: Bearer <accessToken>
   * Response: AuthUserDto representing the current user.
   * Errors: 401 if the access token is missing/invalid.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.getCurrentUser(user.id, user.role);
  }

  /**
   * POST /auth/refresh
   * Body: { refreshToken }
   * Response: TokenResponseDto (rotated tokens + user)
   * Errors: 401 when the refresh token is invalid/expired/revoked.
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken, dto.role);
  }

  /**
   * POST /auth/logout
   * Body: { refreshToken }
   * Response: { success: true }
   * Side effects: provided refresh token gets revoked immediately so it cannot be reused.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: RequestUser, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken, user.id);
  }

  /**
   * POST /auth/password/forgot
   * Body: { email }
   * Response: { success: true } and a reset token (for development) if the account exists.
   */
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  /**
   * POST /auth/password/reset
   * Body: { token, password }
   * Response: { success: true }
   */
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
