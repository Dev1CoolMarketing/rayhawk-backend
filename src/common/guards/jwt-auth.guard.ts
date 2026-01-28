import { ExecutionContext, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SupabaseAuthService } from '../../modules/auth/supabase-auth.service';
import { RequestUser } from '../../modules/auth/types/request-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Optional() private readonly supabaseAuth?: SupabaseAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    if (this.supabaseAuth && this.supabaseAuth.isConfigured()) {
      const cookieName = process.env.AUTH_COOKIE_NAME ?? 'tshots_access_token';
      const cookieToken = this.extractCookieToken(request.headers.cookie, cookieName);
      const authorization =
        request.headers.authorization ?? (cookieToken ? `Bearer ${cookieToken}` : undefined);
      request.user = await this.supabaseAuth.authenticateBearer(authorization);
      return true;
    }

    const result = (await super.canActivate(context)) as boolean;
    return result;
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser, _info?: unknown, _context?: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired access token');
    }
    return user;
  }

  private extractCookieToken(header: string | undefined, name: string): string | null {
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
}
