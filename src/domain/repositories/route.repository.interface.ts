import { Route } from '../entities/route.entity';
import { RouteStatus } from '../enums';

export interface IRouteRepository {
  findById(id: string): Promise<Route | null>;
  findByCode(code: string): Promise<Route | null>;
  findAll(status?: RouteStatus): Promise<Route[]>;
  create(route: Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isInbound' | 'isOutbound'>): Promise<Route>;
  update(id: string, partial: Partial<Route>): Promise<Route>;
}

export const ROUTE_REPOSITORY_TOKEN = Symbol('IRouteRepository');
