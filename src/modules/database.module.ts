import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { AuditService } from '../infrastructure/database/audit.service';

import { PrismaUserRepository } from '../infrastructure/database/repositories/prisma-user.repository';
import { PrismaBusRepository } from '../infrastructure/database/repositories/prisma-bus.repository';
import { PrismaRouteRepository } from '../infrastructure/database/repositories/prisma-route.repository';
import { PrismaStopRepository } from '../infrastructure/database/repositories/prisma-stop.repository';
import { PrismaCampusRepository } from '../infrastructure/database/repositories/prisma-campus.repository';
import { PrismaScheduleRepository } from '../infrastructure/database/repositories/prisma-schedule.repository';
import { PrismaAlertRepository } from '../infrastructure/database/repositories/prisma-alert.repository';
import { PrismaIncidentRepository } from '../infrastructure/database/repositories/prisma-incident.repository';
import { PrismaServiceStatusRepository } from '../infrastructure/database/repositories/prisma-service-status.repository';

import { USER_REPOSITORY_TOKEN } from '../domain/repositories/user.repository.interface';
import { BUS_REPOSITORY_TOKEN } from '../domain/repositories/bus.repository.interface';
import { ROUTE_REPOSITORY_TOKEN } from '../domain/repositories/route.repository.interface';
import { STOP_REPOSITORY_TOKEN } from '../domain/repositories/stop.repository.interface';
import { CAMPUS_REPOSITORY_TOKEN } from '../domain/repositories/campus.repository.interface';
import { SCHEDULE_REPOSITORY_TOKEN } from '../domain/repositories/schedule.repository.interface';
import { ALERT_REPOSITORY_TOKEN } from '../domain/repositories/alert.repository.interface';
import { INCIDENT_REPOSITORY_TOKEN } from '../domain/repositories/incident.repository.interface';
import { SERVICE_STATUS_REPOSITORY_TOKEN } from '../domain/repositories/service-status.repository.interface';

@Global()
@Module({
  providers: [
    PrismaService,
    AuditService,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    {
      provide: BUS_REPOSITORY_TOKEN,
      useClass: PrismaBusRepository,
    },
    {
      provide: ROUTE_REPOSITORY_TOKEN,
      useClass: PrismaRouteRepository,
    },
    {
      provide: STOP_REPOSITORY_TOKEN,
      useClass: PrismaStopRepository,
    },
    {
      provide: CAMPUS_REPOSITORY_TOKEN,
      useClass: PrismaCampusRepository,
    },
    {
      provide: SCHEDULE_REPOSITORY_TOKEN,
      useClass: PrismaScheduleRepository,
    },
    {
      provide: ALERT_REPOSITORY_TOKEN,
      useClass: PrismaAlertRepository,
    },
    {
      provide: INCIDENT_REPOSITORY_TOKEN,
      useClass: PrismaIncidentRepository,
    },
    {
      provide: SERVICE_STATUS_REPOSITORY_TOKEN,
      useClass: PrismaServiceStatusRepository,
    },
  ],
  exports: [
    PrismaService,
    AuditService,
    USER_REPOSITORY_TOKEN,
    BUS_REPOSITORY_TOKEN,
    ROUTE_REPOSITORY_TOKEN,
    STOP_REPOSITORY_TOKEN,
    CAMPUS_REPOSITORY_TOKEN,
    SCHEDULE_REPOSITORY_TOKEN,
    ALERT_REPOSITORY_TOKEN,
    INCIDENT_REPOSITORY_TOKEN,
    SERVICE_STATUS_REPOSITORY_TOKEN,
  ],
})
export class DatabaseModule {}
