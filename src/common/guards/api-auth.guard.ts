import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenService } from '../../modules/auth/auth-token.service';
import { RequestUser } from '../../modules/auth/types/request-user.interface';
import { UserRole } from '../../modules/auth/types/auth.types';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly tokens: AuthTokenService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const authHeader = this.getHeader(request, 'authorization');
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const requestedRole = this.resolveRequestedRole(request);
    request.user = await this.tokens.resolveRequestUser(token, requestedRole);
    return true;
  }

  private resolveRequestedRole(request: Request): UserRole | null {
    const header = this.getHeader(request, 'x-auth-role') ?? this.getHeader(request, 'x-auth-audience');
    if (!header) {
      return null;
    }
    const normalized = header.trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'user' || normalized === 'vendor' || normalized === 'customer') {
      return normalized as UserRole;
    }
    return null;
  }

  private getHeader(request: Request, name: string): string | null {
    const value = request.headers[name];
    if (!value) {
      return null;
    }
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value;
  }
}
