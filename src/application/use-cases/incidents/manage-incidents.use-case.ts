import { Inject, Injectable } from '@nestjs/common';
import { IIncidentRepository, INCIDENT_REPOSITORY_TOKEN } from '../../../domain/repositories/incident.repository.interface';
import { Incident } from '../../../domain/entities/incident.entity';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../../../domain/enums';
import { AuditService } from '../../../infrastructure/database/audit.service';

@Injectable()
export class ManageIncidentsUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY_TOKEN)
    private readonly incidentRepository: IIncidentRepository,
    private readonly auditService: AuditService,
  ) {}

  async getOpen(routeId?: string): Promise<Incident[]> {
    return await this.incidentRepository.findOpen(routeId);
  }

  async create(data: {
    type: IncidentType;
    severity?: IncidentSeverity;
    description: string;
    routeId?: string | null;
    stopId?: string | null;
    vehicleId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdById?: string | null;
    ipAddress?: string;
  }): Promise<Incident> {
    const incident = await this.incidentRepository.create(data);

    await this.auditService.logAction({
      actorId: data.createdById,
      action: 'REPORT_INCIDENT',
      entityType: 'Incident',
      entityId: incident.id,
      newValue: incident,
      ipAddress: data.ipAddress,
    });

    return incident;
  }

  async updateStatus(id: string, status: IncidentStatus, actorId?: string, ipAddress?: string): Promise<Incident> {
    const updated = await this.incidentRepository.updateStatus(id, status);

    await this.auditService.logAction({
      actorId,
      action: 'UPDATE_INCIDENT_STATUS',
      entityType: 'Incident',
      entityId: id,
      newValue: { status },
      ipAddress,
    });

    return updated;
  }
}
