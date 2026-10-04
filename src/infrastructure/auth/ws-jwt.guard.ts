import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  ITokenService,
  TOKEN_SERVICE_TOKEN,
} from '../../application/ports/token.service.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly jwtTokenService: ITokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    // Extract token from handshake auth, authorization header or query param
    const authHeader =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization ||
      client.handshake.query?.token;

    if (!authHeader) {
      this.logger.warn(`WS Connection rejected: Missing token from client ${client.id}`);
      throw new WsException('Unauthorized: Missing JWT token in WebSocket handshake');
    }

    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : String(authHeader);

    try {
      const payload = await this.jwtTokenService.verifyToken(token);
      // Store user payload on the socket instance
      client.data.user = payload;
      return true;
    } catch {
      this.logger.warn(`WS Connection rejected: Invalid JWT token from client ${client.id}`);
      throw new WsException('Unauthorized: Invalid or expired WebSocket token');
    }
  }
}
