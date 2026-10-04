import { AlertPriority, AlertType } from '../enums';

export class Alert {
  constructor(
    public readonly id: string,
    public readonly type: AlertType,
    public readonly priority: AlertPriority,
    public readonly title: string,
    public readonly message: string,
    public readonly startsAt: Date = new Date(),
    public readonly routeId?: string | null,
    public readonly stopId?: string | null,
    public readonly tripId?: string | null,
    public readonly expiresAt?: Date | null,
    public readonly isActive: boolean = true,
    public readonly createdById?: string | null,
  ) {}

  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  }
}
