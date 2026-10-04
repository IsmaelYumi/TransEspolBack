import { ServiceStatusType } from '../enums';

export class ServiceStatus {
  constructor(
    public readonly id: string,
    public readonly scope: string = 'SYSTEM',
    public readonly status: ServiceStatusType = ServiceStatusType.NORMAL,
    public readonly title: string = 'Servicio Normal',
    public readonly targetId?: string | null,
    public readonly description?: string | null,
    public readonly reason?: string | null,
    public readonly startsAt: Date = new Date(),
    public readonly endsAt?: Date | null,
  ) {}
}
