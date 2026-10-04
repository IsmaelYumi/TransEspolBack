import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('EspolMoveAlertBootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');

  // CORS Configuration
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  // Global API Prefix
  app.setGlobalPrefix(apiPrefix);

  // Global DTO Validation via class-validator & class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: true, // Throw error on unexpected fields
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ESPOL MOVE ALERT — Mobility Backend API')
    .setDescription(
      'Plataforma central y Single Source of Truth para servicios de movilidad interna de ESPOL (Campus Gustavo Galindo).\n\n' +
        '**Pilares de Arquitectura y Negocio:**\n' +
        '- **Clean Architecture & Modular Monolith:** Dominios desacoplados sin dependencias circulares.\n' +
        '- **Autenticación Institucional Microsoft:** Integración Azure AD para cuentas `@espol.edu.ec` y roles (PASSENGER, OPERATOR, ADMIN).\n' +
        '- **Rutas Independientes y Atómicas:** Las rutas no se pueden unir ni combinar. Cada una opera como un circuito cerrado.\n' +
        '- **Pasajero con Acceso Exclusivo de Visualización (Read-Only):** Consulta de paradas, horarios, trazados, alertas y planificación de viajes sin capacidad de mutación.\n' +
        '- **Tiempo Real Opcional & Redis:** Telemetría GPS con caché temporal de 120s, indexación geoespacial `GEOADD` y retransmisión por WebSockets. El sistema opera al 100% con horarios teóricos ante ausencia de señal GPS.\n' +
        '- **Auditoría e Incidencias:** Trazabilidad completa de modificaciones administrativas.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Autenticación Institucional ESPOL', 'Endpoints de login y sesión con Microsoft y JWT')
    .addTag('Planificación de Viajes (Journey Planning)', 'Búsqueda de rutas compatibles entre paradas/POIs sin inventar tiempos')
    .addTag('Rutas y Paradas', 'Catálogo de recorridos oficiales de entrada y salida')
    .addTag('Paradas (Stops)', 'Directorio de paradas activas y búsqueda espacial por cercanía')
    .addTag('Horarios Programados (Schedules)', 'Frecuencias y franjas de operación diurna/nocturna')
    .addTag('Campus y Puntos de Interés', 'Estructura física del campus, facultades y edificios')
    .addTag('Flota de Buses', 'Unidades vehiculares y asignaciones operativas')
    .addTag('Capa de Ingesta de Telemetría (GPS / AVL / Sensores)', 'Endpoint agnóstico de coordenadas externas')
    .addTag('Rastreo y Telemetría en Tiempo Real', 'Coordenadas temporales en Redis y telemetría HTTP')
    .addTag('Alertas y Notificaciones de Servicio', 'Avisos de retraso, desvíos y anuncios para pasajeros')
    .addTag('Incidencias Operativas (Averías, Retrasos, Bloqueos)', 'Registro y resolución de incidencias en ruta')
    .addTag('Estado Operacional del Servicio (Service Status)', 'Semáforo y estado global de la red de transporte')
    .addTag('Auditoría Administrativa (Audit Logs)', 'Historial de modificaciones del sistema')
    .addTag('Monitoreo del Sistema', 'Health checks de PostgreSQL (Prisma 7) y Redis')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'ESPOL Move Alert API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(port);

  logger.log(`================================================================`);
  logger.log(` ESPOL Move Alert Backend running at: http://localhost:${port}/${apiPrefix}`);
  logger.log(` Swagger API Documentation:           http://localhost:${port}/docs`);
  logger.log(` WebSockets Tracking Gateway:         ws://localhost:${port}/tracking`);
  logger.log(` PostgreSQL (Prisma 7):               Active`);
  logger.log(` Redis Coordinates Cache:             Active (TTL: 120s)`);
  logger.log(` Single Source of Truth:              Ready for InterMóvil and Web`);
  logger.log(`================================================================`);
}

bootstrap();
