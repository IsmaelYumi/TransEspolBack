import { TripStatus } from '../enums';

export class Trip {
  constructor(
    public readonly id: string,
    public readonly routeId: string,
    public readonly vehicleId: string,
    public readonly serviceDate: Date,
    public readonly scheduledStart: Date,
    public readonly status: TripStatus = TripStatus.SCHEDULED,
    public readonly driverId?: string | null,
    public readonly actualStart?: Date | null,
    public readonly actualEnd?: Date | null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  public isInProgress(): boolean {
    return this.status === TripStatus.IN_PROGRESS;
  }
}
