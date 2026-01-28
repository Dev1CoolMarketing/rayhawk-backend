import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { createHash } from 'crypto';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken, User, Vendor } from '../../entities';
import { UsersService } from '../users/users.service';
import { mapUserToAuthUserDto } from './auth.mapper';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtPayload, RefreshJwtPayload } from './types/jwt-payload.interface';
import { AuthAudience, UserRole } from './types/auth.types';
import { getAssignableRoles } from './utils/role.utils';
import { CustomersService } from '../customers/customers.service';
import { CustomerProfileRequiredException } from './exceptions/customer-profile-required.exception';
import { MailerService } from '../mailer/mailer.service';
import { AuditLogsService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(Vendor)
    private readonly vendorsRepo: Repository<Vendor>,
    private readonly customersService: CustomersService,
    private readonly mailer: MailerService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async register(dto: RegisterUserDto): Promise<TokenResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await hash(dto.password, this.saltRounds);
    const user = await this.usersService.create(normalizedEmail, passwordHash);
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'register',
      resourceType: 'user',
      resourceId: user.id,
    });
    return this.issueTokens(user);
  }

  async registerCustomer(dto: RegisterCustomerDto): Promise<TokenResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await hash(dto.password, this.saltRounds);
    const user = await this.usersService.create(normalizedEmail, passwordHash, 'customer');
    await this.customersService.createProfile(user.id, dto.birthYear);
    const hydrated = await this.usersService.findById(user.id);
    if (!hydrated) {
      throw new NotFoundException('User not found after registration');
    }
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'register_customer',
      resourceType: 'user',
      resourceId: user.id,
    });
    return this.issueTokens(hydrated);
  }

  async login(user: User, audience?: AuthAudience, birthYear?: number | null): Promise<TokenResponseDto> {
    // If logging in as a customer and profile is missing, allow creation when birthYear is supplied.
    if (audience === 'customer') {
      if (!user.customerProfile) {
        if (!birthYear) {
          throw new CustomerProfileRequiredException();
        }
        await this.customersService.createProfile(user.id, birthYear);
        // Refresh user to include the created profile
        const hydrated = await this.usersService.findById(user.id);
        if (!hydrated) {
          throw new NotFoundException('User not found after creating customer profile');
        }
        user = hydrated;
      }
    }
    const result = await this.issueTokens(user, { requestedRole: audience ?? null });
    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'login',
      resourceType: 'user',
      resourceId: user.id,
      metadata: audience ? { audience } : undefined,
    });
    return result;
  }

  async getCurrentUser(userId: string, activeRole?: UserRole) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserWithVendor(user, activeRole);
  }

  async refresh(refreshToken: string, requestedRole?: AuthAudience): Promise<TokenResponseDto> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash: this.hashToken(refreshToken) },
      relations: ['user'],
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    let user = storedToken.user;
    if (!user || user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Refresh token no longer valid');
    }
    if (requestedRole) {
      const hydrated = await this.usersService.findById(user.id);
      if (!hydrated) {
        throw new UnauthorizedException('Refresh token no longer valid');
      }
      user = hydrated;
    }

    storedToken.revokedAt = new Date();
    await this.refreshTokenRepo.save(storedToken);

    return this.issueTokens(user, { requestedRole: requestedRole ?? null });
  }

  async logout(refreshToken: string, userId: string): Promise<{ success: true }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    if (payload.sub !== userId) {
      throw new UnauthorizedException('Refresh token does not belong to this user');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });
    if (storedToken && storedToken.user.id !== userId) {
      throw new UnauthorizedException('Refresh token does not belong to this user');
    }

    if (storedToken && !storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
      await this.refreshTokenRepo.save(storedToken);
    }

    void this.auditLogs.record({
      actorUserId: userId,
      action: 'logout',
      resourceType: 'user',
      resourceId: userId,
    });
    return { success: true };
  }

  async requestPasswordReset(email: string): Promise<{ success: true; token?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      // Do not leak existence; respond success.
      return { success: true };
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tv: user.tokenVersion,
      type: 'password_reset',
    };

    const token = await this.jwt.signAsync(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: this.getResetTokenTtlSeconds(),
    });

    try {
      await this.mailer.sendPasswordResetEmail({ to: user.email, token });
    } catch (error) {
      this.logger.error('Unable to send password reset email', error as any);
      // Do not leak email issues to the client; they still see success.
    }

    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'password_reset_request',
      resourceType: 'user',
      resourceId: user.id,
    });
    const includeToken = this.config.get<string>('NODE_ENV') !== 'production';
    return { success: true, token: includeToken ? token : undefined };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: true }> {
    let payload: { sub: string; tv: number; type?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.getAccessTokenSecret(),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.type !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const passwordHash = await hash(newPassword, this.saltRounds);
    // Invalidate existing sessions by bumping token version
    const nextTokenVersion = user.tokenVersion + 1;
    await this.usersService.updatePassword(user.id, passwordHash, nextTokenVersion);
    await this.cleanupExpiredTokens(user.id);

    void this.auditLogs.record({
      actorUserId: user.id,
      action: 'password_reset',
      resourceType: 'user',
      resourceId: user.id,
    });
    return { success: true };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async issueTokens(
    user: User,
    options?: {
      requestedRole?: UserRole | AuthAudience | null;
    },
  ): Promise<TokenResponseDto> {
    await this.cleanupExpiredTokens(user.id);
    const accessTtlSeconds = this.getAccessTokenTtlSeconds();
    const refreshTtlSeconds = this.getRefreshTokenTtlSeconds();
    const activeRole = this.resolveActiveRole(user, options?.requestedRole ?? null);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(this.buildAccessPayload(user, activeRole), {
        secret: this.getAccessTokenSecret(),
        expiresIn: accessTtlSeconds,
      }),
      this.jwt.signAsync(this.buildRefreshPayload(user, activeRole), {
        secret: this.getRefreshTokenSecret(),
        expiresIn: refreshTtlSeconds,
      }),
    ]);

    await this.persistRefreshToken(user, refreshToken, refreshTtlSeconds);
    const authUser = await this.mapUserWithVendor(user, activeRole);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: accessTtlSeconds,
      refreshTokenExpiresIn: refreshTtlSeconds,
      user: authUser,
    };
  }

  private async persistRefreshToken(user: User, refreshToken: string, ttlSeconds: number) {
    const entity = this.refreshTokenRepo.create({
      user,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });
    await this.refreshTokenRepo.save(entity);
  }

  private async cleanupExpiredTokens(userId: string) {
    try {
      await this.refreshTokenRepo.delete({
        user: { id: userId },
        expiresAt: LessThan(new Date()),
      });
    } catch (error) {
      this.logger.warn(`Failed to cleanup refresh tokens: ${(error as Error).message}`);
    }
  }

  private async verifyRefreshToken(token: string): Promise<RefreshJwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshJwtPayload>(token, {
        secret: this.getRefreshTokenSecret(),
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private buildAccessPayload(user: User, roleOverride?: UserRole): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: roleOverride ?? user.role,
      tv: user.tokenVersion,
    };
  }

  private buildRefreshPayload(user: User, roleOverride?: UserRole): RefreshJwtPayload {
    return {
      sub: user.id,
      tv: user.tokenVersion,
      type: 'refresh',
      role: roleOverride ?? user.role,
    };
  }

  private async mapUserWithVendor(user: User, roleOverride?: UserRole) {
    const vendor = await this.vendorsRepo.findOne({ where: { ownerId: user.id } });
    return mapUserToAuthUserDto(user, vendor, user.customerProfile ?? null, roleOverride);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAccessTokenSecret(): string {
    const secret = this.config.get<string>('JWT_ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_TOKEN_SECRET is not configured');
    }
    return secret;
  }

  private getRefreshTokenSecret(): string {
    const secret = this.config.get<string>('JWT_REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_TOKEN_SECRET is not configured');
    }
    return secret;
  }

  private getAccessTokenTtlSeconds(): number {
    return this.parseDurationSeconds(this.config.get<string>('JWT_ACCESS_TOKEN_TTL_SECONDS'), 900);
  }

  private getRefreshTokenTtlSeconds(): number {
    return this.parseDurationSeconds(this.config.get<string>('JWT_REFRESH_TOKEN_TTL_SECONDS'), 60 * 60 * 24 * 14);
  }

  private getResetTokenTtlSeconds(): number {
    return this.parseDurationSeconds(this.config.get<string>('PASSWORD_RESET_TOKEN_TTL_SECONDS'), 15 * 60);
  }

  private parseDurationSeconds(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private resolveActiveRole(user: User, requestedRole?: UserRole | AuthAudience | null): UserRole {
    if (!requestedRole) {
      return user.role;
    }
    const allowedRoles = getAssignableRoles(user);
    if (!allowedRoles.has(requestedRole)) {
      if (requestedRole === 'customer') {
        throw new CustomerProfileRequiredException();
      }
      throw new UnauthorizedException(`User cannot authenticate as ${requestedRole}`);
    }
    return requestedRole;
  }
}
