import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IIncidentRepository } from '../../../domain/repositories/incident.repository.interface';
import { Incident } from '../../../domain/entities/incident.entity';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../../../domain/enums';
import { Incident as PrismaIncidentModel } from '@prisma/client';

@Injectable()
export class PrismaIncidentRepository implements IIncidentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaIncidentModel): Incident {
    return new Incident(
      raw.id,
      raw.type as IncidentType,
      raw.severity as IncidentSeverity,
      raw.description,
      raw.status as IncidentStatus,
      raw.routeId,
      raw.stopId,
      raw.vehicleId,
      raw.tripId,
      raw.latitude,
      raw.longitude,
      raw.occurredAt,
      raw.resolvedAt,
      raw.createdById,
    );
  }

  async findOpen(routeId?: string): Promise<Incident[]> {
    const raw = await this.prisma.incident.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        ...(routeId && { routeId }),
      },
      orderBy: { occurredAt: 'desc' },
    });
    return raw.map((i) => this.toDomain(i));
  }

  async create(data: {
    type: IncidentType;
    severity?: IncidentSeverity;
    description: string;
    routeId?: string | null;
    stopId?: string | null;
    vehicleId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdById?: string | null;
  }): Promise<Incident> {
    const created = await this.prisma.incident.create({
      data: {
        type: data.type,
        severity: data.severity ?? IncidentSeverity.MEDIUM,
        description: data.description,
        routeId: data.routeId ?? null,
        stopId: data.stopId ?? null,
        vehicleId: data.vehicleId ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        createdById: data.createdById ?? null,
        status: IncidentStatus.OPEN,
      },
    });
    return this.toDomain(created);
  }

  async updateStatus(id: string, status: IncidentStatus): Promise<Incident> {
    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status,
        ...(status === IncidentStatus.RESOLVED && { resolvedAt: new Date() }),
      },
    });
    return this.toDomain(updated);
  }
}
