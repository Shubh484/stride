import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from '../interfaces/auth-result.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof SafeUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: SafeUser = request.user;
    return data ? user?.[data] : user;
  },
);
