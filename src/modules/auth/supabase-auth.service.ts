import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify, JWTPayload } from 'jose';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';
import { UserRole } from './types/auth.types';
import { RequestUser } from './types/request-user.interface';

type SupabaseJwtPayload = JWTPayload & {
  email?: string;
  role?: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string; first_name?: string; last_name?: string };
};

const SUPPORTED_ROLES: UserRole[] = ['admin', 'user', 'vendor', 'customer'];

@Injectable()
export class SupabaseAuthService {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;
  private issuer?: string;
  private legacySecret?: Uint8Array | null;

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.resolveJwksUrl() || this.resolveLegacySecret());
  }

  async authenticateBearer(authorization?: string): Promise<RequestUser> {
    const token = this.extractBearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyToken(token);
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    if (!email) {
      throw new UnauthorizedException('Supabase token missing email');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const roleFromToken = this.resolveRole(payload);
    const user =
      (await this.usersService.findByEmail(normalizedEmail)) ??
      (await this.usersService.createFromSupabase({
        email: normalizedEmail,
        role: roleFromToken,
        firstName: this.readMetadataString(payload.user_metadata, 'first_name'),
        lastName: this.readMetadataString(payload.user_metadata, 'last_name'),
      }));
    const needsCustomerProfile = roleFromToken === 'vendor' && !user.customerProfile;
    let hasCustomerProfile = Boolean(user.customerProfile);
    if (needsCustomerProfile) {
      const birthYear = this.readMetadataNumber(payload.user_metadata, 'birth_year');
      if (birthYear !== null) {
        await this.customersService.upsertProfile(user.id, birthYear);
        hasCustomerProfile = true;
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role ?? roleFromToken,
      tokenVersion: user.tokenVersion ?? 0,
      hasCustomerProfile,
    };
  }

  private async verifyToken(token: string): Promise<SupabaseJwtPayload> {
    const jwksUrl = this.resolveJwksUrl();
    const issuer = this.resolveIssuer();
    let jwksError: unknown;
    let hsError: unknown;

    if (jwksUrl) {
      if (!this.jwks) {
        this.jwks = createRemoteJWKSet(jwksUrl);
      }
      try {
        const { payload } = await jwtVerify(token, this.jwks, issuer ? { issuer } : undefined);
        return payload as SupabaseJwtPayload;
      } catch (error) {
        jwksError = error;
      }
    }

    const legacySecret = this.resolveLegacySecret();
    if (legacySecret) {
      try {
        const { payload } = await jwtVerify(
          token,
          legacySecret,
          issuer ? { issuer, algorithms: ['HS256'] } : { algorithms: ['HS256'] },
        );
        return payload as SupabaseJwtPayload;
      } catch (error) {
        hsError = error;
      }
    }

    if (!jwksUrl && !legacySecret) {
      throw new UnauthorizedException('Supabase auth is not configured');
    }

    this.logVerificationFailure(token, issuer, jwksUrl, jwksError, hsError);
    throw new UnauthorizedException('Invalid Supabase access token');
  }

  private logVerificationFailure(
    token: string,
    issuer: string | undefined,
    jwksUrl: URL | null,
    jwksError: unknown,
    hsError: unknown,
  ) {
    try {
      const decoded = decodeJwt(token);
      const header = decodeProtectedHeader(token);
      const tokenExp = typeof decoded.exp === 'number' ? decoded.exp : undefined;
      const nowSec = Math.floor(Date.now() / 1000);
      console.warn('[SupabaseAuth] Token verification failed', {
        expectedIssuer: issuer,
        tokenIssuer: typeof decoded.iss === 'string' ? decoded.iss : undefined,
        tokenExp,
        nowSec,
        expired: typeof tokenExp === 'number' ? tokenExp < nowSec : undefined,
        tokenAlg: header.alg,
        tokenKid: typeof header.kid === 'string' ? header.kid : undefined,
        jwksUrl: jwksUrl?.toString(),
        jwksError: this.describeError(jwksError),
        hsError: this.describeError(hsError),
        usedLegacySecret: Boolean(this.resolveLegacySecret()),
      });
    } catch {
      console.warn('[SupabaseAuth] Token verification failed (unable to decode)', {
        jwksUrl: jwksUrl?.toString(),
        jwksError: this.describeError(jwksError),
        hsError: this.describeError(hsError),
        usedLegacySecret: Boolean(this.resolveLegacySecret()),
      });
    }
  }

  private resolveIssuer(): string | undefined {
    if (this.issuer !== undefined) {
      return this.issuer;
    }
    const explicit = this.config.get<string>('SUPABASE_JWT_ISSUER');
    if (explicit) {
      this.issuer = explicit.replace(/\/$/, '');
      return this.issuer;
    }
    const supabaseUrl = this.resolveSupabaseUrl();
    this.issuer = supabaseUrl ? `${supabaseUrl}/auth/v1` : undefined;
    return this.issuer;
  }

  private resolveSupabaseUrl(): string | null {
    const url = this.config.get<string>('SUPABASE_URL')?.trim();
    if (!url) {
      return null;
    }
    return url.replace(/\/$/, '');
  }

  private resolveJwksUrl(): URL | null {
    const explicit = this.config.get<string>('SUPABASE_JWKS_URL')?.trim();
    if (explicit) {
      return new URL(explicit);
    }
    const supabaseUrl = this.resolveSupabaseUrl();
    if (!supabaseUrl) {
      return null;
    }
    return new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
  }

  private resolveLegacySecret(): Uint8Array | null {
    if (this.legacySecret !== undefined) {
      return this.legacySecret;
    }
    const raw = this.config.get<string>('SUPABASE_JWT_SECRET')?.trim();
    this.legacySecret = raw ? new TextEncoder().encode(raw) : null;
    return this.legacySecret;
  }

  private describeError(error: unknown): { name?: string; message?: string } | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }
    const maybeError = error as { name?: unknown; message?: unknown };
    return {
      name: typeof maybeError.name === 'string' ? maybeError.name : undefined,
      message: typeof maybeError.message === 'string' ? maybeError.message : undefined,
    };
  }

  private resolveRole(payload: SupabaseJwtPayload): UserRole {
    const metadataRole =
      this.readMetadataString(payload.app_metadata, 'role') ??
      this.readMetadataString(payload.user_metadata, 'role');
    if (metadataRole && SUPPORTED_ROLES.includes(metadataRole as UserRole)) {
      return metadataRole as UserRole;
    }
    if (payload.role === 'authenticated') {
      return 'user';
    }
    if (payload.role && SUPPORTED_ROLES.includes(payload.role as UserRole)) {
      return payload.role as UserRole;
    }
    return 'user';
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }
    return token;
  }

  private readMetadataString(metadata: unknown, key: string): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim().length ? value.trim() : null;
  }

  private readMetadataNumber(metadata: unknown, key: string): number | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const raw = (metadata as Record<string, unknown>)[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }
    if (typeof raw === 'string' && raw.trim().length) {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

}
