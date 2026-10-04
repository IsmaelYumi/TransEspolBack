import { Inject, Injectable } from '@nestjs/common';
import {
  IRouteRepository,
  ROUTE_REPOSITORY_TOKEN,
} from '../../../domain/repositories/route.repository.interface';
import { Route } from '../../../domain/entities/route.entity';
import { RouteStatus } from '../../../domain/enums';

@Injectable()
export class GetRoutesUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY_TOKEN)
    private readonly routeRepository: IRouteRepository,
  ) {}

  async execute(status?: RouteStatus): Promise<Route[]> {
    return await this.routeRepository.findAll(status);
  }
}
