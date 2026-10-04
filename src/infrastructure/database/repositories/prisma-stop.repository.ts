import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IStopRepository } from '../../../domain/repositories/stop.repository.interface';
import { Stop } from '../../../domain/entities/stop.entity';
import { StopStatus, StopType } from '../../../domain/enums';
import { Stop as PrismaStopModel } from '@prisma/client';

@Injectable()
export class PrismaStopRepository implements IStopRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaStopModel): Stop {
    return new Stop(
      raw.id,
      raw.name,
      raw.latitude,
      raw.longitude,
      raw.code,
      raw.description,
      raw.type as StopType,
      raw.status as StopStatus,
      raw.elevation,
      raw.campusId,
    );
  }

  async findById(id: string): Promise<Stop | null> {
    const stop = await this.prisma.stop.findUnique({ where: { id } });
    return stop ? this.toDomain(stop) : null;
  }

  async findByCode(code: string): Promise<Stop | null> {
    const stop = await this.prisma.stop.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    return stop ? this.toDomain(stop) : null;
  }

  async findAll(): Promise<Stop[]> {
    const stops = await this.prisma.stop.findMany({
      orderBy: { name: 'asc' },
    });
    return stops.map((s) => this.toDomain(s));
  }

  async findActive(): Promise<Stop[]> {
    const stops = await this.prisma.stop.findMany({
      where: { status: StopStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
    return stops.map((s) => this.toDomain(s));
  }

  async findNearby(latitude: number, longitude: number, radiusKm = 1.0): Promise<Stop[]> {
    const stops = await this.findActive();
    return stops.filter((s) => {
      const dist = this.haversineDistanceKm(latitude, longitude, s.latitude, s.longitude);
      return dist <= radiusKm;
    });
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
