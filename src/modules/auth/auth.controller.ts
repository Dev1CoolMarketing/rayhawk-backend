import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { decodeJwt } from 'jose';
import { User as CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User as UserEntity } from '../../entities';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthUserDto, TokenResponseDto } from './dto/token-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RequestUser } from './types/request-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseWebAuthService } from './supabase-web-auth.service';
import { WebRegisterDto } from './dto/web-register.dto';
import { AuditLogsService } from '../audit/audit.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly supabaseWebAuth: SupabaseWebAuthService,
    private readonly auditLogs: AuditLogsService,
  ) {}

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

  @Post('web/login')
  async webLogin(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    this.assertSupabaseConfigured();
    const session = await this.supabaseWebAuth.signInWithPassword(dto.email.trim().toLowerCase(), dto.password);
    if (!this.hasAccessToken(session)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.setAuthCookies(res, session);
    const user = await this.loadAuthUser(session.access_token);
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'login_web',
      resourceType: 'user',
      resourceId: user.id,
      metadata: dto.audience ? { audience: dto.audience } : undefined,
    });
    return {
      user,
      accessTokenExpiresIn: session.expires_in ?? this.decodeExpiresIn(session.access_token),
    };
  }

  @Post('web/register')
  async webRegister(@Body() dto: WebRegisterDto, @Res({ passthrough: true }) res: Response) {
    this.assertSupabaseConfigured();
    const response = await this.supabaseWebAuth.signUp(dto.email.trim().toLowerCase(), dto.password, dto.redirectTo);
    const session = this.extractSession(response);
    if (!session) {
      return { requiresVerification: true };
    }
    this.setAuthCookies(res, session);
    const user = await this.loadAuthUser(session.access_token);
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'register_web',
      resourceType: 'user',
      resourceId: user.id,
    });
    return {
      requiresVerification: false,
      user,
      accessTokenExpiresIn: session.expires_in ?? this.decodeExpiresIn(session.access_token),
    };
  }

  @Get('web/session')
  async webSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.assertSupabaseConfigured();
    const accessToken = this.readCookie(req, this.getAccessCookieName());
    if (!accessToken) {
      throw new UnauthorizedException('Missing session');
    }
    try {
      const user = await this.loadAuthUser(accessToken);
      return {
        user,
        accessTokenExpiresIn: this.decodeExpiresIn(accessToken),
      };
    } catch (error) {
      const refreshToken = this.readCookie(req, this.getRefreshCookieName());
      if (!refreshToken) {
        this.clearAuthCookies(res);
        throw error;
      }
      const refreshed = await this.supabaseWebAuth.refreshSession(refreshToken).catch(() => null);
      if (!refreshed?.access_token) {
        this.clearAuthCookies(res);
        throw new UnauthorizedException('Session expired');
      }
      this.setAuthCookies(res, refreshed);
      const user = await this.loadAuthUser(refreshed.access_token);
      return {
        user,
        accessTokenExpiresIn: refreshed.expires_in ?? this.decodeExpiresIn(refreshed.access_token),
      };
    }
  }

  @Post('web/refresh')
  async webRefresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.assertSupabaseConfigured();
    const refreshToken = this.readCookie(req, this.getRefreshCookieName());
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const refreshed = await this.supabaseWebAuth.refreshSession(refreshToken);
    if (!refreshed?.access_token) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    this.setAuthCookies(res, refreshed);
    const user = await this.loadAuthUser(refreshed.access_token);
    return {
      user,
      accessTokenExpiresIn: refreshed.expires_in ?? this.decodeExpiresIn(refreshed.access_token),
    };
  }

  @HttpCode(200)
  @Post('web/logout')
  async webLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.assertSupabaseConfigured();
    const accessToken = this.readCookie(req, this.getAccessCookieName());
    if (accessToken) {
      await this.supabaseWebAuth.logout(accessToken);
    }
    this.clearAuthCookies(res);
    return { success: true };
  }

  private async loadAuthUser(accessToken: string): Promise<AuthUserDto> {
    const requestUser = await this.supabaseAuth.authenticateBearer(`Bearer ${accessToken}`);
    return this.authService.getCurrentUser(requestUser.id, requestUser.role) as Promise<AuthUserDto>;
  }

  private extractSession(
    payload: unknown,
  ): { access_token: string; refresh_token?: string; expires_in?: number } | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    const typed = payload as Record<string, any>;
    if (typeof typed.access_token === 'string') {
      return typed as { access_token: string; refresh_token?: string; expires_in?: number };
    }
    if (typed.session && typeof typed.session === 'object' && typeof typed.session.access_token === 'string') {
      return typed.session as { access_token: string; refresh_token?: string; expires_in?: number };
    }
    return null;
  }

  private decodeExpiresIn(accessToken: string): number {
    try {
      const payload = decodeJwt(accessToken);
      if (typeof payload.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(payload.exp - now, 0);
      }
    } catch {
      // Ignore decoding issues, fallback below.
    }
    return 60 * 60;
  }

  private getAccessCookieName(): string {
    return process.env.AUTH_COOKIE_NAME ?? 'tshots_access_token';
  }

  private getRefreshCookieName(): string {
    return process.env.AUTH_REFRESH_COOKIE_NAME ?? 'tshots_refresh_token';
  }

  private getCookieDomain(): string | undefined {
    return process.env.AUTH_COOKIE_DOMAIN;
  }

  private hasAccessToken(
    session: { access_token?: string; refresh_token?: string; expires_in?: number } | null | undefined,
  ): session is { access_token: string; refresh_token?: string; expires_in?: number } {
    return typeof session?.access_token === 'string' && session.access_token.length > 0;
  }

  private setAuthCookies(
    res: Response,
    session: { access_token: string; refresh_token?: string; expires_in?: number },
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const accessTokenTtl = session.expires_in ?? 60 * 60;
    res.cookie(this.getAccessCookieName(), session.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenTtl * 1000,
      domain: this.getCookieDomain(),
    });
    if (session.refresh_token) {
      res.cookie(this.getRefreshCookieName(), session.refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 * 1000,
        domain: this.getCookieDomain(),
      });
    }
  }

  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(this.getAccessCookieName(), '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      domain: this.getCookieDomain(),
    });
    res.cookie(this.getRefreshCookieName(), '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      domain: this.getCookieDomain(),
    });
  }

  private readCookie(req: Request, name: string): string | null {
    const header = req.headers.cookie;
    if (!header) return null;
    const parts = header.split(';');
    for (const part of parts) {
      const [rawKey, ...rest] = part.trim().split('=');
      if (!rawKey || rawKey !== name) continue;
      const rawValue = rest.join('=');
      if (!rawValue) return null;
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
    return null;
  }

  private assertSupabaseConfigured() {
    if (!this.supabaseAuth.isConfigured()) {
      throw new BadRequestException('Supabase auth is not configured');
    }
  }
}
