import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ITrackingCacheRepository,
  TRACKING_CACHE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/tracking-cache.repository.interface';
import {
  IBusRepository,
  BUS_REPOSITORY_TOKEN,
} from '../../../domain/repositories/bus.repository.interface';
import {
  IEventPublisher,
  EVENT_PUBLISHER_TOKEN,
} from '../../ports/event-publisher.service.interface';
import { VehicleLocation } from '../../../domain/entities/vehicle-location.entity';
import { BusStatus } from '../../../domain/enums';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface UpdateLocationCommand {
  busId: string;
  routeId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  driverId?: string;
}

@Injectable()
export class UpdateVehicleLocationUseCase {
  private readonly logger = new Logger(UpdateVehicleLocationUseCase.name);

  constructor(
    @Inject(TRACKING_CACHE_REPOSITORY_TOKEN)
    private readonly trackingCacheRepository: ITrackingCacheRepository,
    @Inject(BUS_REPOSITORY_TOKEN)
    private readonly busRepository: IBusRepository,
    @Inject(EVENT_PUBLISHER_TOKEN)
    private readonly eventPublisher: IEventPublisher,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateLocationCommand): Promise<VehicleLocation> {
    // 1. Verify bus exists
    const bus = await this.busRepository.findById(command.busId);
    if (!bus) {
      throw new NotFoundException(`Bus con ID ${command.busId} no encontrado.`);
    }

    const effectiveRouteId = command.routeId || bus.activeRouteId || null;

    // 2. Build domain VehicleLocation entity
    const location = new VehicleLocation(
      command.busId,
      effectiveRouteId,
      command.latitude,
      command.longitude,
      command.speed ?? 0,
      command.heading ?? 0,
      command.accuracy ?? 5,
      new Date(),
      command.driverId || bus.driverId || null,
    );

    // 3. Cache coordinates in Redis (fast in-memory path with TTL)
    await this.trackingCacheRepository.saveLocation(location);

    // 4. Publish real-time coordinate update via WebSockets to route channel
    this.eventPublisher.publishLocationUpdate(location);

    // 5. Update bus status to ON_ROUTE if currently idle
    if (bus.status !== BusStatus.ON_ROUTE) {
      await this.busRepository.updateStatus(bus.id, BusStatus.ON_ROUTE);
      this.eventPublisher.publishBusStatusChange(bus.id, BusStatus.ON_ROUTE, effectiveRouteId);
    }

    // 6. Asynchronously append to PostgreSQL vehicle_positions log (fire and forget, non-blocking)
    this.prisma.vehiclePosition
      .create({
        data: {
          vehicleId: location.busId,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          accuracy: location.accuracy,
        },
      })
      .catch((err) => {
        this.logger.debug(`Historical location log skipped: ${err.message}`);
      });

    return location;
  }
}
