import { Inject, Injectable } from '@nestjs/common';
import {
  ITrackingCacheRepository,
  TRACKING_CACHE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/tracking-cache.repository.interface';
import { VehicleLocation } from '../../../domain/entities/vehicle-location.entity';

@Injectable()
export class GetLiveLocationsUseCase {
  constructor(
    @Inject(TRACKING_CACHE_REPOSITORY_TOKEN)
    private readonly trackingCacheRepository: ITrackingCacheRepository,
  ) {}

  async execute(routeId?: string): Promise<VehicleLocation[]> {
    if (routeId) {
      return await this.trackingCacheRepository.getLocationsByRoute(routeId);
    }
    return await this.trackingCacheRepository.getAllLocations();
  }

  async getNearby(latitude: number, longitude: number, radiusKm = 2): Promise<VehicleLocation[]> {
    return await this.trackingCacheRepository.findNearbyBuses(latitude, longitude, radiusKm);
  }

  async getBusLocation(busId: string): Promise<VehicleLocation | null> {
    return await this.trackingCacheRepository.getLocation(busId);
  }
}
