import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IRouteRepository,
  ROUTE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/route.repository.interface';
import {
  ITrackingCacheRepository,
  TRACKING_CACHE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/tracking-cache.repository.interface';
import { Route } from '../../../domain/entities/route.entity';
import { VehicleLocation } from '../../../domain/entities/vehicle-location.entity';

export interface RouteDetailResult {
  route: Route;
  activeBuses: VehicleLocation[];
}

@Injectable()
export class GetRouteDetailUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
    @Inject(TRACKING_CACHE_REPOSITORY_TOKEN)
    private readonly trackingCacheRepository: ITrackingCacheRepository,
  ) {}

  async execute(routeId: string): Promise<RouteDetailResult> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new NotFoundException(`Ruta con ID "${routeId}" no encontrada`);
    }

    // Get live coordinates from Redis cache
    const activeBuses = await this.trackingCacheRepository.getLocationsByRoute(routeId);

    return {
      route,
      activeBuses,
    };
  }
}
