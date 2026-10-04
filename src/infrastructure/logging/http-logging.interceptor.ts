import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          const logMsg = `[${correlationId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms (IP: ${ip})`;
          if (duration > 500) {
            this.logger.warn(`SLOW QUERY: ${logMsg}`);
          } else {
            this.logger.log(logMsg);
          }
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const statusCode = err.status || err.statusCode || 500;
          this.logger.error(
            `[${correlationId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - Error: ${err.message}`,
          );
        },
      }),
    );
  }
}
