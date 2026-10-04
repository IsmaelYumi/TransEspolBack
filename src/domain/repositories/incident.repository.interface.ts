import { Incident } from '../entities/incident.entity';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../enums';

export interface IIncidentRepository {
  findOpen(routeId?: string): Promise<Incident[]>;
  create(data: {
    type: IncidentType;
    severity?: IncidentSeverity;
    description: string;
    routeId?: string | null;
    stopId?: string | null;
    vehicleId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdById?: string | null;
  }): Promise<Incident>;
  updateStatus(id: string, status: IncidentStatus): Promise<Incident>;
}

export const INCIDENT_REPOSITORY_TOKEN = Symbol('IIncidentRepository');
