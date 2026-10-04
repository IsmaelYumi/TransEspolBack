import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../application/ports/token.service.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
