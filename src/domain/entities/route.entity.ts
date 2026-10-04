import { RouteDirection, RouteServiceType, RouteStatus } from '../enums';
import { Stop } from './stop.entity';

export class Route {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly description?: string | null,
    public readonly direction: RouteDirection = RouteDirection.INBOUND,
    public readonly serviceType: RouteServiceType = RouteServiceType.NORMAL,
    public readonly colorHex: string = '#003366',
    public readonly status: RouteStatus = RouteStatus.ACTIVE,
    public readonly polyline?: string | null,
    public readonly stops: Stop[] = [],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  public isActive(): boolean {
    return this.status === RouteStatus.ACTIVE;
  }

  public isInbound(): boolean {
    return this.direction === RouteDirection.INBOUND;
  }

  public isOutbound(): boolean {
    return this.direction === RouteDirection.OUTBOUND;
  }
}
