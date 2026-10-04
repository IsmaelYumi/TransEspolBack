import { Injectable, LoggerService, LogLevel, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService implements LoggerService {
  private context?: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  setContext(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: any, context?: string, correlationId?: string) {
    const timestamp = new Date().toISOString();
    const activeContext = context || this.context || 'TransEspol';

    if (this.isProduction) {
      return JSON.stringify({
        timestamp,
        level,
        context: activeContext,
        correlationId,
        message: typeof message === 'object' ? message : message,
      });
    }

    const prefix = `[TransEspol] [${timestamp}] [${level.toUpperCase()}] [${activeContext}]`;
    const corrStr = correlationId ? ` [CID: ${correlationId}]` : '';
    return `${prefix}${corrStr} ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}`;
  }

  log(message: any, context?: string, correlationId?: string) {
    console.log(this.formatMessage('log', message, context, correlationId));
  }

  error(message: any, trace?: string, context?: string, correlationId?: string) {
    console.error(this.formatMessage('error', message, context, correlationId));
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string, correlationId?: string) {
    console.warn(this.formatMessage('warn', message, context, correlationId));
  }

  debug(message: any, context?: string, correlationId?: string) {
    if (!this.isProduction) {
      console.debug(this.formatMessage('debug', message, context, correlationId));
    }
  }

  verbose(message: any, context?: string, correlationId?: string) {
    if (!this.isProduction) {
      console.info(this.formatMessage('verbose', message, context, correlationId));
    }
  }
}
