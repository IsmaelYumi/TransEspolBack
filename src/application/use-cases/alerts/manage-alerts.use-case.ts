import { Inject, Injectable } from '@nestjs/common';
import { IAlertRepository, ALERT_REPOSITORY_TOKEN } from '../../../domain/repositories/alert.repository.interface';
import { Alert } from '../../../domain/entities/alert.entity';
import { AlertPriority, AlertType } from '../../../domain/enums';
import { AuditService } from '../../../infrastructure/database/audit.service';
import { TrackingGateway } from '../../../presentation/gateways/tracking.gateway';

@Injectable()
export class ManageAlertsUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY_TOKEN)
    private readonly alertRepository: IAlertRepository,
    private readonly auditService: AuditService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async getActive(routeId?: string): Promise<Alert[]> {
    return await this.alertRepository.findActive(routeId);
  }

  async create(data: {
    type: AlertType;
    priority?: AlertPriority;
    title: string;
    message: string;
    routeId?: string | null;
    stopId?: string | null;
    startsAt?: Date;
    expiresAt?: Date | null;
    createdById?: string | null;
    ipAddress?: string;
  }): Promise<Alert> {
    const alert = await this.alertRepository.create(data);

    // Audit log
    await this.auditService.logAction({
      actorId: data.createdById,
      action: 'CREATE_ALERT',
      entityType: 'Alert',
      entityId: alert.id,
      newValue: alert,
      ipAddress: data.ipAddress,
    });

    // Realtime broadcast to connected mobile clients
    if (this.trackingGateway.server) {
      if (alert.routeId) {
        this.trackingGateway.server.to(`route:${alert.routeId}`).emit('alert:published', alert);
      }
      this.trackingGateway.server.emit('alert:published', alert);
    }

    return alert;
  }

  async resolve(id: string, actorId?: string, ipAddress?: string): Promise<Alert> {
    const resolved = await this.alertRepository.resolve(id);

    await this.auditService.logAction({
      actorId,
      action: 'RESOLVE_ALERT',
      entityType: 'Alert',
      entityId: id,
      newValue: { isActive: false },
      ipAddress,
    });

    return resolved;
  }
}
