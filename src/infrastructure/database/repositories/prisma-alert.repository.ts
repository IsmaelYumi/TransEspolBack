import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IAlertRepository } from '../../../domain/repositories/alert.repository.interface';
import { Alert } from '../../../domain/entities/alert.entity';
import { AlertPriority, AlertType } from '../../../domain/enums';
import { Alert as PrismaAlertModel } from '@prisma/client';

@Injectable()
export class PrismaAlertRepository implements IAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaAlertModel): Alert {
    return new Alert(
      raw.id,
      raw.type as AlertType,
      raw.priority as AlertPriority,
      raw.title,
      raw.message,
      raw.startsAt,
      raw.routeId,
      raw.stopId,
      raw.tripId,
      raw.expiresAt,
      raw.isActive,
      raw.createdById,
    );
  }

  async findActive(routeId?: string): Promise<Alert[]> {
    const now = new Date();
    const raw = await this.prisma.alert.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        ...(routeId && { routeId }),
      },
      orderBy: { startsAt: 'desc' },
    });
    return raw.map((a) => this.toDomain(a));
  }

  async create(data: {
    type: AlertType;
    priority?: AlertPriority;
    title: string;
    message: string;
    routeId?: string | null;
    stopId?: string | null;
    startsAt?: Date;
    expiresAt?: Date | null;
    createdById?: string | null;
  }): Promise<Alert> {
    const created = await this.prisma.alert.create({
      data: {
        type: data.type,
        priority: data.priority ?? AlertPriority.MEDIUM,
        title: data.title,
        message: data.message,
        routeId: data.routeId ?? null,
        stopId: data.stopId ?? null,
        startsAt: data.startsAt ?? new Date(),
        expiresAt: data.expiresAt ?? null,
        createdById: data.createdById ?? null,
      },
    });
    return this.toDomain(created);
  }

  async resolve(id: string): Promise<Alert> {
    const updated = await this.prisma.alert.update({
      where: { id },
      data: { isActive: false },
    });
    return this.toDomain(updated);
  }
}
