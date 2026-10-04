import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IRouteRepository } from '../../../domain/repositories/route.repository.interface';
import { Route } from '../../../domain/entities/route.entity';
import { Stop } from '../../../domain/entities/stop.entity';
import { RouteDirection, RouteServiceType, RouteStatus, StopStatus, StopType } from '../../../domain/enums';

@Injectable()
export class PrismaRouteRepository implements IRouteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: any): Route {
    const stops: Stop[] = (raw.routeStops || []).map(
      (rs: any) =>
        new Stop(
          rs.stop.id,
          rs.stop.name,
          rs.stop.latitude,
          rs.stop.longitude,
          rs.stop.code,
          rs.stop.description,
          rs.stop.type as StopType,
          rs.stop.status as StopStatus,
          rs.stop.elevation,
          rs.stop.campusId,
          rs.sequence,
          rs.pickupAllowed,
          rs.dropoffAllowed,
          rs.estimatedOffsetSeconds,
        ),
    );

    return new Route(
      raw.id,
      raw.code,
      raw.name,
      raw.description,
      raw.direction as RouteDirection,
      raw.serviceType as RouteServiceType,
      raw.colorHex,
      raw.status as RouteStatus,
      raw.polyline,
      stops,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  async findById(id: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        routeStops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    return route ? this.toDomain(route) : null;
  }

  async findByCode(code: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        routeStops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    return route ? this.toDomain(route) : null;
  }

  async findAll(status?: RouteStatus): Promise<Route[]> {
    const routes = await this.prisma.route.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        routeStops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });
    return routes.map((r) => this.toDomain(r));
  }

  async create(
    data: Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isInbound' | 'isOutbound'>,
  ): Promise<Route> {
    const created = await this.prisma.route.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name,
        description: data.description ?? null,
        direction: data.direction ?? RouteDirection.INBOUND,
        serviceType: data.serviceType ?? RouteServiceType.NORMAL,
        colorHex: data.colorHex ?? '#003366',
        status: data.status ?? RouteStatus.ACTIVE,
        polyline: data.polyline ?? null,
      },
      include: {
        routeStops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, partial: Partial<Route>): Promise<Route> {
    const updated = await this.prisma.route.update({
      where: { id },
      data: {
        ...(partial.name && { name: partial.name }),
        ...(partial.description !== undefined && { description: partial.description }),
        ...(partial.direction && { direction: partial.direction }),
        ...(partial.serviceType && { serviceType: partial.serviceType }),
        ...(partial.colorHex && { colorHex: partial.colorHex }),
        ...(partial.status && { status: partial.status }),
        ...(partial.polyline !== undefined && { polyline: partial.polyline }),
      },
      include: {
        routeStops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    return this.toDomain(updated);
  }
}
