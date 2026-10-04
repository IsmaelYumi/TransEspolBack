export class PointOfInterest {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly buildingId?: string | null,
    public readonly description?: string | null,
    public readonly elevation?: number | null,
  ) {}
}

export class Building {
  constructor(
    public readonly id: string,
    public readonly campusId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly faculty?: string | null,
    public readonly elevation?: number | null,
    public readonly pois: PointOfInterest[] = [],
  ) {}
}

export class Campus {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly description?: string | null,
    public readonly latitude: number = -2.1465,
    public readonly longitude: number = -79.9664,
    public readonly buildings: Building[] = [],
  ) {}
}
