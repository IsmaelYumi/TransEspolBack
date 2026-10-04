import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IServiceStatusRepository } from '../../../domain/repositories/service-status.repository.interface';
import { ServiceStatus } from '../../../domain/entities/service-status.entity';
import { ServiceStatusType } from '../../../domain/enums';
import { ServiceStatusRecord as PrismaModel } from '@prisma/client';

@Injectable()
export class PrismaServiceStatusRepository implements IServiceStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaModel): ServiceStatus {
    return new ServiceStatus(
      raw.id,
      raw.scope,
      raw.status as ServiceStatusType,
      raw.title,
      raw.targetId,
      raw.description,
      raw.reason,
      raw.startsAt,
      raw.endsAt,
    );
  }

  async getLatest(): Promise<ServiceStatus[]> {
    const raw = await this.prisma.serviceStatusRecord.findMany({
      orderBy: { startsAt: 'desc' },
      take: 10,
    });
    return raw.map((r) => this.toDomain(r));
  }

  async create(data: {
    scope?: string;
    targetId?: string | null;
    status: ServiceStatusType;
    title: string;
    description?: string | null;
    reason?: string | null;
  }): Promise<ServiceStatus> {
    const created = await this.prisma.serviceStatusRecord.create({
      data: {
        scope: data.scope ?? 'SYSTEM',
        targetId: data.targetId ?? null,
        status: data.status,
        title: data.title,
        description: data.description ?? null,
        reason: data.reason ?? null,
      },
    });
    return this.toDomain(created);
  }
}
