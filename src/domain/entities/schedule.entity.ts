export class Schedule {
  constructor(
    public readonly id: string,
    public readonly routeId: string,
    public readonly dayOfWeek: string,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly frequencyMinutes: number = 15,
    public readonly validFrom: Date = new Date(),
    public readonly validTo?: Date | null,
    public readonly status: string = 'ACTIVE',
  ) {}

  public isOperatingNow(currentTime = new Date()): boolean {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[currentTime.getDay()];
    if (this.dayOfWeek !== currentDay) return false;

    const currentHoursMinutes = currentTime.toTimeString().slice(0, 5); // "HH:mm"
    return currentHoursMinutes >= this.startTime && currentHoursMinutes <= this.endTime;
  }
}
