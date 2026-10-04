import { VehicleLocation } from '../entities/vehicle-location.entity';

export interface ITrackingCacheRepository {
  saveLocation(location: VehicleLocation): Promise<void>;
  getLocation(busId: string): Promise<VehicleLocation | null>;
  getAllLocations(): Promise<VehicleLocation[]>;
  getLocationsByRoute(routeId: string): Promise<VehicleLocation[]>;
  removeLocation(busId: string): Promise<void>;
  findNearbyBuses(latitude: number, longitude: number, radiusKm: number): Promise<VehicleLocation[]>;
}

export const TRACKING_CACHE_REPOSITORY_TOKEN = Symbol('ITrackingCacheRepository');
