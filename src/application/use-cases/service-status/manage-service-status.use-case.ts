import { Inject, Injectable } from '@nestjs/common';
import { IServiceStatusRepository, SERVICE_STATUS_REPOSITORY_TOKEN } from '../../../domain/repositories/service-status.repository.interface';
import { ServiceStatus } from '../../../domain/entities/service-status.entity';
import { ServiceStatusType } from '../../../domain/enums';
import { AuditService } from '../../../infrastructure/database/audit.service';
import { TrackingGateway } from '../../../presentation/gateways/tracking.gateway';

@Injectable()
export class ManageServiceStatusUseCase {
  constructor(
    @Inject(SERVICE_STATUS_REPOSITORY_TOKEN)
    private readonly serviceStatusRepository: IServiceStatusRepository,
    private readonly auditService: AuditService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async getLatest(): Promise<ServiceStatus[]> {
    return await this.serviceStatusRepository.getLatest();
  }

  async create(data: {
    scope?: string;
    targetId?: string | null;
    status: ServiceStatusType;
    title: string;
    description?: string | null;
    reason?: string | null;
    actorId?: string | null;
    ipAddress?: string;
  }): Promise<ServiceStatus> {
    const record = await this.serviceStatusRepository.create(data);

    await this.auditService.logAction({
      actorId: data.actorId,
      action: 'UPDATE_SERVICE_STATUS',
      entityType: 'ServiceStatusRecord',
      entityId: record.id,
      newValue: record,
      ipAddress: data.ipAddress,
    });

    if (this.trackingGateway.server) {
      this.trackingGateway.server.emit('service_status:updated', record);
    }

    return record;
  }
}
