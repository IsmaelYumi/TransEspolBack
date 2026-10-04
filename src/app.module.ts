import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { validateEnvironment } from './infrastructure/config/env.validation';
import { DatabaseModule } from './modules/database.module';
import { CacheModule } from './modules/cache.module';
import { AuthModule } from './modules/auth.module';
import { RoutesModule } from './modules/routes.module';
import { BusesModule } from './modules/buses.module';
import { TrackingModule } from './modules/tracking.module';
import { CampusModule } from './modules/campus.module';
import { StopsModule } from './modules/stops.module';
import { SchedulesModule } from './modules/schedules.module';
import { JourneysModule } from './modules/journeys.module';
import { AlertsModule } from './modules/alerts.module';
import { IncidentsModule } from './modules/incidents.module';
import { ServiceStatusModule } from './modules/service-status.module';
import { TelemetryModule } from './modules/telemetry.module';
import { AuditModule } from './modules/audit.module';

import { HealthController } from './presentation/controllers/health.controller';
import { CentralizedExceptionFilter } from './presentation/filters/centralized-exception.filter';
import { HttpLoggingInterceptor } from './infrastructure/logging/http-logging.interceptor';
import { StructuredLoggerService } from './infrastructure/logging/structured-logger.service';

@Module({
  imports: [
    // Protected Environment Configuration with strict class-validator schema
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath: ['.env'],
    }),

    // Centralized Rate Limiting / Throttler
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: (config.get<number>('THROTTLE_TTL', 60) * 1000), // ms
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Core Data & Infrastructure Modules
    DatabaseModule,
    CacheModule,
    AuthModule,

    // ESPOL Move Alert Domain Modules
    CampusModule,
    StopsModule,
    RoutesModule,
    SchedulesModule,
    BusesModule,
    TrackingModule,
    JourneysModule,
    AlertsModule,
    IncidentsModule,
    ServiceStatusModule,
    TelemetryModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    StructuredLoggerService,
    // Global Centralized Error Filter
    {
      provide: APP_FILTER,
      useClass: CentralizedExceptionFilter,
    },
    // Global HTTP Logging & Performance Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
