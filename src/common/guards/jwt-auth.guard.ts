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
    const route = `${request.method ?? 'N/A'} ${request.url ?? 'N/A'}`;
    if (this.supabaseAuth && this.supabaseAuth.isConfigured()) {
      // eslint-disable-next-line no-console
      console.log(`[AuthGuard] ${route} using Supabase auth`);
      request.user = await this.supabaseAuth.authenticateBearer(request.headers.authorization);
      // eslint-disable-next-line no-console
      console.log(`[AuthGuard] ${route} Supabase auth ok`, {
        userId: request.user?.id,
        role: request.user?.role,
      });
      return true;
    }

    const result = (await super.canActivate(context)) as boolean;
    // eslint-disable-next-line no-console
    console.log(`[AuthGuard] ${route} jwt strategy result=${result}`);
    return result;
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser, _info?: unknown, _context?: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired access token');
    }
    return user;
  }
}
