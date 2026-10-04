import { Bus } from '../entities/bus.entity';
import { BusStatus } from '../enums';

export interface IBusRepository {
  findById(id: string): Promise<Bus | null>;
  findByPlate(plateNumber: string): Promise<Bus | null>;
  findByUnitNumber(unitNumber: string): Promise<Bus | null>;
  findByDriverId(driverId: string): Promise<Bus | null>;
  findAll(): Promise<Bus[]>;
  findActiveOnRoute(routeId?: string): Promise<Bus[]>;
  create(bus: Omit<Bus, 'id' | 'createdAt' | 'updatedAt' | 'isAvailable' | 'isOnRoute'>): Promise<Bus>;
  updateStatus(id: string, status: BusStatus): Promise<Bus>;
  assignRouteAndDriver(id: string, routeId: string | null, driverId: string | null): Promise<Bus>;
}

export const BUS_REPOSITORY_TOKEN = Symbol('IBusRepository');
