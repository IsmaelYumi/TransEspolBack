import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class CentralizedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CentralizedExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Skip non-HTTP contexts (e.g. WebSockets)
    if (!response || !request) {
      return;
    }

    const correlationId = (request.headers['x-correlation-id'] as string) || 'N/A';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorTitle = 'Internal Server Error';
    let message: any = 'An unexpected error occurred on the server';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        errorTitle = (res as any).error || exception.name;
      } else {
        message = res;
        errorTitle = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma 7 Known Errors
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[])?.join(', ') || 'recurso';
          errorTitle = 'Conflict';
          message = `Conflicto de unicidad: El campo [${target}] ya existe en la base de datos.`;
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          errorTitle = 'Not Found';
          message = 'El registro solicitado no fue encontrado en la base de datos.';
          break;
        }
        case 'P2003': {
          statusCode = HttpStatus.BAD_REQUEST;
          errorTitle = 'Foreign Key Violation';
          message = 'Violación de clave foránea: Uno de los identificadores relacionados no existe.';
          break;
        }
        default: {
          statusCode = HttpStatus.BAD_REQUEST;
          errorTitle = `Database Error (${exception.code})`;
          message = exception.message.split('\n').pop() || 'Error en la base de datos PostgreSQL.';
          break;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorTitle = exception.name;
    }

    const errorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      method: request.method,
      error: errorTitle,
      message,
      correlationId,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `[${correlationId}] 500 Error: ${request.method} ${request.url} - ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${correlationId}] ${statusCode} ${errorTitle}: ${request.method} ${request.url} - ${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}
