import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { Schedule } from '../../../domain/entities/schedule.entity';
import { Schedule as PrismaScheduleModel } from '@prisma/client';

@Injectable()
export class PrismaScheduleRepository implements IScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaScheduleModel): Schedule {
    return new Schedule(
      raw.id,
      raw.routeId,
      raw.dayOfWeek,
      raw.startTime,
      raw.endTime,
      raw.frequencyMinutes,
      raw.validFrom,
      raw.validTo,
      raw.status,
    );
  }

  async findByRoute(routeId: string): Promise<Schedule[]> {
    const raw = await this.prisma.schedule.findMany({
      where: { routeId, status: 'ACTIVE' },
      orderBy: { startTime: 'asc' },
    });
    return raw.map((s) => this.toDomain(s));
  }

  async findAll(): Promise<Schedule[]> {
    const raw = await this.prisma.schedule.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { startTime: 'asc' },
    });
    return raw.map((s) => this.toDomain(s));
  }
}
