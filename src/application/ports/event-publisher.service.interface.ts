import { VehicleLocation } from '../../domain/entities/vehicle-location.entity';
import { BusStatus } from '../../domain/enums';

export interface IEventPublisher {
  publishLocationUpdate(location: VehicleLocation): void;
  publishBusStatusChange(busId: string, status: BusStatus, routeId?: string | null): void;
}

export const EVENT_PUBLISHER_TOKEN = Symbol('IEventPublisher');
