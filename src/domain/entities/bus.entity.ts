import { BusStatus } from '../enums';

export class Bus {
  constructor(
    public readonly id: string,
    public readonly plateNumber: string,
    public readonly unitNumber: string,
    public readonly capacity: number = 45,
    public readonly status: BusStatus = BusStatus.IDLE,
    public readonly isActive: boolean = true,
    public readonly driverId?: string | null,
    public readonly activeRouteId?: string | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  public isAvailable(): boolean {
    return this.isActive && this.status === BusStatus.IDLE;
  }

  public isOnRoute(): boolean {
    return this.isActive && this.status === BusStatus.ON_ROUTE;
  }
}
