import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, JWTPayload, JWTVerifyOptions } from 'jose';
import { User } from '../../entities';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './types/jwt-payload.interface';
import { RequestUser } from './types/request-user.interface';
import { UserRole } from './types/auth.types';
import { getAssignableRoles } from './utils/role.utils';

const SUPABASE_PROVIDER = 'supabase';
const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthTokenService {
  private readonly supabaseJwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly supabaseIssuer?: string;
  private readonly supabaseAudience?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {
    const jwksUrl = this.config.get<string>('SUPABASE_JWKS_URL');
    if (jwksUrl) {
      this.supabaseJwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    const issuerOverride = this.config.get<string>('SUPABASE_JWT_ISSUER');
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    if (issuerOverride) {
      this.supabaseIssuer = issuerOverride;
    } else if (supabaseUrl) {
      this.supabaseIssuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
    }

    const audience = this.config.get<string>('SUPABASE_JWT_AUDIENCE');
    if (audience) {
      this.supabaseAudience = audience;
    }
  }

  async resolveRequestUser(token: string, requestedRole?: UserRole | null): Promise<RequestUser> {
    let headerAlg = '';
    try {
      const header = decodeProtectedHeader(token);
      headerAlg = header.alg ?? '';
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (headerAlg.startsWith('RS')) {
      if (!this.supabaseJwks) {
        throw new UnauthorizedException('Supabase auth is not configured');
      }
      return this.resolveSupabaseUser(token, requestedRole ?? null);
    }

    return this.resolveLocalUser(token);
  }

  private async resolveLocalUser(token: string): Promise<RequestUser> {
    const secret = this.config.get<string>('JWT_ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT access token secret is not configured');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

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

  private async resolveSupabaseUser(token: string, requestedRole: UserRole | null): Promise<RequestUser> {
    if (!this.supabaseJwks) {
      throw new UnauthorizedException('Supabase auth is not configured');
    }

    let payload: JWTPayload;
    try {
      const options: JWTVerifyOptions = {};
      if (this.supabaseIssuer) {
        options.issuer = this.supabaseIssuer;
      }
      if (this.supabaseAudience) {
        options.audience = this.supabaseAudience;
      }
      const result = await jwtVerify(token, this.supabaseJwks, options);
      payload = result.payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const authSubject = payload.sub;
    const email = this.normalizeEmail(payload.email);
    if (!authSubject || !email) {
      throw new UnauthorizedException('Supabase token is missing required claims');
    }

    let user = await this.usersService.findByAuthSubject(SUPABASE_PROVIDER, authSubject);
    if (!user) {
      const existing = await this.usersService.findByEmail(email);
      if (existing) {
        user = await this.usersService.linkAuthSubject(existing.id, SUPABASE_PROVIDER, authSubject);
      }
    }

    if (!user) {
      const role = this.resolveRoleFromMetadata(payload) ?? 'user';
      const passwordHash = await this.buildPlaceholderPassword();
      user = await this.usersService.create(email, passwordHash, role, {
        provider: SUPABASE_PROVIDER,
        subject: authSubject,
      });
    }

    const allowedRoles = getAssignableRoles(user);
    const role = this.resolveActiveRole(user, allowedRoles, requestedRole, payload);

    return {
      id: user.id,
      email: user.email,
      role,
      tokenVersion: user.tokenVersion,
      hasCustomerProfile: Boolean(user.customerProfile),
    };
  }

  private resolveActiveRole(
    user: User,
    allowedRoles: Set<UserRole>,
    requestedRole: UserRole | null,
    payload: JWTPayload,
  ): UserRole {
    if (requestedRole && allowedRoles.has(requestedRole)) {
      return requestedRole;
    }

    const metadataRole = this.resolveRoleFromMetadata(payload);
    if (metadataRole && allowedRoles.has(metadataRole)) {
      return metadataRole;
    }

    if (user.role === 'user' && user.customerProfile) {
      return 'customer';
    }

    return user.role;
  }

  private resolveRoleFromMetadata(payload: JWTPayload): UserRole | null {
    const role =
      this.normalizeRole((payload as { app_metadata?: { role?: string } }).app_metadata?.role) ??
      this.normalizeRole((payload as { user_metadata?: { role?: string } }).user_metadata?.role);
    return role;
  }

  private normalizeEmail(value: JWTPayload['email']): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeRole(value: string | undefined): UserRole | null {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    if (normalized === 'admin' || normalized === 'user' || normalized === 'vendor' || normalized === 'customer') {
      return normalized as UserRole;
    }
    return null;
  }

  private async buildPlaceholderPassword(): Promise<string> {
    const raw = randomBytes(24).toString('hex');
    return hash(raw, PASSWORD_SALT_ROUNDS);
  }
}
