import { StopStatus, StopType } from '../enums';

export class Stop {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly code?: string | null,
    public readonly description?: string | null,
    public readonly type: StopType = StopType.STANDARD,
    public readonly status: StopStatus = StopStatus.ACTIVE,
    public readonly elevation?: number | null,
    public readonly campusId?: string | null,
    public readonly orderIndex: number = 0,
    public readonly pickupAllowed: boolean = true,
    public readonly dropoffAllowed: boolean = true,
    public readonly estimatedOffsetSeconds?: number | null,
  ) {}

  public isActive(): boolean {
    return this.status === StopStatus.ACTIVE;
  }
}
