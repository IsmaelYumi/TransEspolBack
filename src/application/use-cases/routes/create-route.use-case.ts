import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  IRouteRepository,
  ROUTE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/route.repository.interface';
import { Route } from '../../../domain/entities/route.entity';
import { RouteDirection, RouteServiceType, RouteStatus } from '../../../domain/enums';

export interface CreateRouteCommand {
  code: string;
  name: string;
  description?: string;
  direction?: RouteDirection;
  serviceType?: RouteServiceType;
  colorHex?: string;
  polyline?: string;
}

@Injectable()
export class CreateRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(command: CreateRouteCommand): Promise<Route> {
    const existing = await this.routeRepository.findByCode(command.code);
    if (existing) {
      throw new ConflictException(`Ya existe una ruta con el código "${command.code}"`);
    }

    return await this.routeRepository.create({
      code: command.code,
      name: command.name,
      description: command.description,
      direction: command.direction ?? RouteDirection.INBOUND,
      serviceType: command.serviceType ?? RouteServiceType.NORMAL,
      colorHex: command.colorHex || '#003366',
      status: RouteStatus.ACTIVE,
      polyline: command.polyline,
      stops: [],
    });
  }
}
