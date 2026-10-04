import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IBusRepository,
  BUS_REPOSITORY_TOKEN,
} from '../../../domain/repositories/bus.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../domain/repositories/user.repository.interface';
import {
  IRouteRepository,
  ROUTE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/route.repository.interface';
import {
  IEventPublisher,
  EVENT_PUBLISHER_TOKEN,
} from '../../ports/event-publisher.service.interface';
import { Bus } from '../../../domain/entities/bus.entity';
import { BusStatus } from '../../../domain/enums';

@Injectable()
export class ManageBusesUseCase {
  constructor(
    @Inject(BUS_REPOSITORY_TOKEN)
    private readonly busRepository: IBusRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
    @Inject(EVENT_PUBLISHER_TOKEN)
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async getAll(): Promise<Bus[]> {
    return await this.busRepository.findAll();
  }

  async getById(id: string): Promise<Bus> {
    const bus = await this.busRepository.findById(id);
    if (!bus) {
      throw new NotFoundException(`Bus con ID ${id} no encontrado`);
    }
    return bus;
  }

  async assignDriverAndRoute(
    busId: string,
    routeId?: string | null,
    driverId?: string | null,
  ): Promise<Bus> {
    const bus = await this.getById(busId);

    if (driverId) {
      const driver = await this.userRepository.findById(driverId);
      if (!driver) {
        throw new NotFoundException(`Conductor con ID ${driverId} no existe`);
      }
    }

    if (routeId) {
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        throw new NotFoundException(`Ruta con ID ${routeId} no existe`);
      }
    }

    const updated = await this.busRepository.assignRouteAndDriver(
      bus.id,
      routeId ?? null,
      driverId ?? null,
    );

    this.eventPublisher.publishBusStatusChange(updated.id, updated.status, updated.activeRouteId);
    return updated;
  }

  async updateStatus(busId: string, status: BusStatus): Promise<Bus> {
    await this.getById(busId);
    const updated = await this.busRepository.updateStatus(busId, status);
    this.eventPublisher.publishBusStatusChange(updated.id, updated.status, updated.activeRouteId);
    return updated;
  }
}
