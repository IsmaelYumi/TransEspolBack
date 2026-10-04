import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IStopRepository, STOP_REPOSITORY_TOKEN } from '../../../domain/repositories/stop.repository.interface';
import { IRouteRepository, ROUTE_REPOSITORY_TOKEN } from '../../../domain/repositories/route.repository.interface';
import { ITrackingCacheRepository, TRACKING_CACHE_REPOSITORY_TOKEN } from '../../../domain/repositories/tracking-cache.repository.interface';
import { IScheduleRepository, SCHEDULE_REPOSITORY_TOKEN } from '../../../domain/repositories/schedule.repository.interface';
import { ICampusRepository, CAMPUS_REPOSITORY_TOKEN } from '../../../domain/repositories/campus.repository.interface';
import { IServiceStatusRepository, SERVICE_STATUS_REPOSITORY_TOKEN } from '../../../domain/repositories/service-status.repository.interface';
import { Stop } from '../../../domain/entities/stop.entity';

export interface PlanJourneyQuery {
  originLat?: number;
  originLng?: number;
  originPoiId?: string;
  destLat?: number;
  destLng?: number;
  destPoiId?: string;
}

export interface JourneyOption {
  route: {
    id: string;
    code: string;
    name: string;
    direction: string;
    colorHex: string;
  };
  originStop: {
    id: string;
    code?: string | null;
    name: string;
    sequence: number;
    pickupAllowed: boolean;
  };
  destinationStop: {
    id: string;
    code?: string | null;
    name: string;
    sequence: number;
    dropoffAllowed: boolean;
  };
  intermediateStops: Array<{ id: string; name: string; sequence: number }>;
  stopCount: number;
  serviceStatus: string;
  realTimeAvailable: boolean;
  activeVehiclesOnRoute: number;
  estimatedDurationMinutes: number | null;
  estimatedArrivalNotice: string;
}

@Injectable()
export class PlanJourneyUseCase {
  constructor(
    @Inject(STOP_REPOSITORY_TOKEN)
    private readonly stopRepository: IStopRepository,
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
    @Inject(TRACKING_CACHE_REPOSITORY_TOKEN)
    private readonly trackingCacheRepository: ITrackingCacheRepository,
    @Inject(SCHEDULE_REPOSITORY_TOKEN)
    private readonly scheduleRepository: IScheduleRepository,
    @Inject(CAMPUS_REPOSITORY_TOKEN)
    private readonly campusRepository: ICampusRepository,
    @Inject(SERVICE_STATUS_REPOSITORY_TOKEN)
    private readonly serviceStatusRepository: IServiceStatusRepository,
  ) {}

  async execute(query: PlanJourneyQuery) {
    // 1. Resolve Origin Coordinates
    let originLat = query.originLat;
    let originLng = query.originLng;

    if (query.originPoiId) {
      const poi = await this.campusRepository.findPoiById(query.originPoiId);
      if (poi) {
        originLat = poi.latitude;
        originLng = poi.longitude;
      }
    }

    // 2. Resolve Destination Coordinates
    let destLat = query.destLat;
    let destLng = query.destLng;

    if (query.destPoiId) {
      const poi = await this.campusRepository.findPoiById(query.destPoiId);
      if (poi) {
        destLat = poi.latitude;
        destLng = poi.longitude;
      }
    }

    if (originLat === undefined || originLng === undefined || destLat === undefined || destLng === undefined) {
      throw new BadRequestException('Se requieren coordenadas de origen y destino o identificadores de puntos de interés (POIs) válidos.');
    }

    // 3. Find closest stops to Origin and Destination
    const allStops = await this.stopRepository.findActive();
    if (allStops.length === 0) {
      throw new NotFoundException('No hay paradas activas registradas en el campus.');
    }

    const originStop = this.findClosestStop(originLat, originLng, allStops);
    const destinationStop = this.findClosestStop(destLat, destLng, allStops);

    if (originStop.id === destinationStop.id) {
      throw new BadRequestException('El origen y el destino se encuentran en la misma parada.');
    }

    // 4. Find compatible routes that connect originStop -> destinationStop in correct sequence
    const allRoutes = await this.routeRepository.findAll();
    const options: JourneyOption[] = [];

    const serviceStatuses = await this.serviceStatusRepository.getLatest();
    const globalStatus = serviceStatuses[0]?.status || 'NORMAL';

    for (const route of allRoutes) {
      const stops = route.stops;
      const originIdx = stops.findIndex((s) => s.id === originStop.id);
      const destIdx = stops.findIndex((s) => s.id === destinationStop.id);

      // Both stops must exist and origin must be visited before destination
      if (originIdx !== -1 && destIdx !== -1 && originIdx < destIdx) {
        const routeOriginStop = stops[originIdx];
        const routeDestStop = stops[destIdx];

        // Check boarding and dropoff constraints
        if (!routeOriginStop.pickupAllowed || !routeDestStop.dropoffAllowed) {
          continue;
        }

        const intermediate = stops.slice(originIdx + 1, destIdx).map((s) => ({
          id: s.id,
          name: s.name,
          sequence: s.orderIndex,
        }));

        // Check live telemetry in Redis cache
        const liveBuses = await this.trackingCacheRepository.getLocationsByRoute(route.id);
        const hasLiveTelemetry = liveBuses.length > 0;

        // Calculate offset difference if available
        let estimatedDuration: number | null = null;
        if (
          routeDestStop.estimatedOffsetSeconds !== undefined &&
          routeOriginStop.estimatedOffsetSeconds !== undefined &&
          routeDestStop.estimatedOffsetSeconds !== null &&
          routeOriginStop.estimatedOffsetSeconds !== null
        ) {
          estimatedDuration = Math.round(
            (routeDestStop.estimatedOffsetSeconds - routeOriginStop.estimatedOffsetSeconds) / 60,
          );
        }

        // Rule: Nunca inventar tiempos de llegada si no hay telemetría activa
        const arrivalNotice = hasLiveTelemetry
          ? `Telemetría en tiempo real activa: ${liveBuses.length} bus(es) en tránsito en esta ruta.`
          : 'Tiempo real no disponible en este momento. Basado en horario regular programado.';

        options.push({
          route: {
            id: route.id,
            code: route.code,
            name: route.name,
            direction: route.direction,
            colorHex: route.colorHex,
          },
          originStop: {
            id: routeOriginStop.id,
            code: routeOriginStop.code,
            name: routeOriginStop.name,
            sequence: routeOriginStop.orderIndex,
            pickupAllowed: routeOriginStop.pickupAllowed,
          },
          destinationStop: {
            id: routeDestStop.id,
            code: routeDestStop.code,
            name: routeDestStop.name,
            sequence: routeDestStop.orderIndex,
            dropoffAllowed: routeDestStop.dropoffAllowed,
          },
          intermediateStops: intermediate,
          stopCount: intermediate.length,
          serviceStatus: globalStatus,
          realTimeAvailable: hasLiveTelemetry,
          activeVehiclesOnRoute: liveBuses.length,
          estimatedDurationMinutes: estimatedDuration,
          estimatedArrivalNotice: arrivalNotice,
        });
      }
    }

    if (options.length === 0) {
      return {
        success: false,
        message: 'No se encontraron rutas directas disponibles que conecten las paradas de origen y destino seleccionadas.',
        originStop: { id: originStop.id, name: originStop.name },
        destinationStop: { id: destinationStop.id, name: destinationStop.name },
        options: [],
      };
    }

    // Sort: Preferred with fewer stops and active real-time
    options.sort((a, b) => {
      if (a.realTimeAvailable && !b.realTimeAvailable) return -1;
      if (!a.realTimeAvailable && b.realTimeAvailable) return 1;
      return a.stopCount - b.stopCount;
    });

    return {
      success: true,
      recommendedOption: options[0],
      alternatives: options.slice(1),
      totalOptions: options.length,
    };
  }

  private findClosestStop(lat: number, lng: number, stops: Stop[]): Stop {
    let closest = stops[0];
    let minDistance = Infinity;

    for (const stop of stops) {
      const dist = this.haversine(lat, lng, stop.latitude, stop.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closest = stop;
      }
    }

    return closest;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
