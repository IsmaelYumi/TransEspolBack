import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ITrackingCacheRepository, TRACKING_CACHE_REPOSITORY_TOKEN } from '../../../domain/repositories/tracking-cache.repository.interface';
import { IEventPublisher, EVENT_PUBLISHER_TOKEN } from '../../ports/event-publisher.service.interface';
import { VehicleLocation } from '../../../domain/entities/vehicle-location.entity';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface IngestTelemetryPayload {
  vehicleId: string;
  tripId?: string;
  routeId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  source?: string;
  timestamp?: string | Date;
}

@Injectable()
export class IngestTelemetryUseCase {
  private readonly logger = new Logger(IngestTelemetryUseCase.name);

  constructor(
    @Inject(TRACKING_CACHE_REPOSITORY_TOKEN)
    private readonly trackingCacheRepository: ITrackingCacheRepository,
    @Inject(EVENT_PUBLISHER_TOKEN)
    private readonly eventPublisher: IEventPublisher,
    private readonly prisma: PrismaService,
  ) {}

  async execute(payload: IngestTelemetryPayload) {
    // 1. Validate vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: payload.vehicleId },
    });

    if (!vehicle) {
      throw new BadRequestException(`Vehículo con ID ${payload.vehicleId} no existe en la base de datos.`);
    }

    // 2. Validate coordinates range
    if (payload.latitude < -90 || payload.latitude > 90 || payload.longitude < -180 || payload.longitude > 180) {
      throw new BadRequestException('Coordenadas geográficas fuera de rango WGS84.');
    }

    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
    const source = payload.source || 'AVL_GPS';

    // 3. Create VehicleLocation entity for Redis cache
    const location = new VehicleLocation(
      payload.vehicleId,
      payload.routeId || null,
      payload.latitude,
      payload.longitude,
      payload.speed ?? 0,
      payload.heading ?? 0,
      payload.accuracy ?? 5,
      timestamp,
    );

    // 4. Update temporary cache in Redis (TTL: 120s)
    await this.trackingCacheRepository.saveLocation(location);

    // 5. Broadcast to route WebSocket room
    this.eventPublisher.publishLocationUpdate(location);

    // 6. Asynchronous persistence to PostgreSQL vehicle_positions table
    this.prisma.vehiclePosition.create({
      data: {
        vehicleId: payload.vehicleId,
        tripId: payload.tripId ?? null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        speed: payload.speed ?? null,
        heading: payload.heading ?? null,
        accuracy: payload.accuracy ?? null,
        source,
        timestamp,
      },
    }).catch((err) => {
      this.logger.debug(`Historical position log skipped: ${err.message}`);
    });

    return {
      status: 'PROCESSED',
      vehicleId: payload.vehicleId,
      timestamp: timestamp.toISOString(),
      source,
    };
  }
}
