import { IncidentSeverity, IncidentStatus, IncidentType } from '../enums';

export class Incident {
  constructor(
    public readonly id: string,
    public readonly type: IncidentType,
    public readonly severity: IncidentSeverity,
    public readonly description: string,
    public readonly status: IncidentStatus = IncidentStatus.OPEN,
    public readonly routeId?: string | null,
    public readonly stopId?: string | null,
    public readonly vehicleId?: string | null,
    public readonly tripId?: string | null,
    public readonly latitude?: number | null,
    public readonly longitude?: number | null,
    public readonly occurredAt: Date = new Date(),
    public readonly resolvedAt?: Date | null,
    public readonly createdById?: string | null,
  ) {}

  public isOpen(): boolean {
    return this.status === IncidentStatus.OPEN || this.status === IncidentStatus.IN_PROGRESS;
  }
}
