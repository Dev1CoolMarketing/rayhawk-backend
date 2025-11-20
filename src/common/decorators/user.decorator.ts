import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../../modules/auth/types/request-user.interface';

export const User = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
  return request.user;
});
