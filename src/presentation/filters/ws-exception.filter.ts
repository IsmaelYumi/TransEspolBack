import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, Error)
export class WsGlobalExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsGlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const errorMsg =
      exception instanceof WsException
        ? exception.getError()
        : (exception as Error).message || 'WebSocket server error';

    this.logger.error(`WebSocket exception for client ${client.id}: ${JSON.stringify(errorMsg)}`);

    client.emit('exception', {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: errorMsg,
    });
  }
}
