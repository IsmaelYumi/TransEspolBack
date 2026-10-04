export class VehicleLocation {
  constructor(
    public readonly busId: string,
    public readonly routeId: string | null,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly speed: number = 0,
    public readonly heading: number = 0,
    public readonly accuracy: number = 5,
    public readonly timestamp: Date = new Date(),
    public readonly driverId?: string | null,
  ) {}

  public isStale(maxAgeSeconds = 120): boolean {
    const ageMs = Date.now() - new Date(this.timestamp).getTime();
    return ageMs > maxAgeSeconds * 1000;
  }

  public toJSON() {
    return {
      busId: this.busId,
      routeId: this.routeId,
      latitude: this.latitude,
      longitude: this.longitude,
      speed: this.speed,
      heading: this.heading,
      accuracy: this.accuracy,
      timestamp: this.timestamp instanceof Date ? this.timestamp.toISOString() : this.timestamp,
      driverId: this.driverId,
    };
  }
}
