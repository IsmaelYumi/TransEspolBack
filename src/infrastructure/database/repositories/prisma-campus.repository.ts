import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICampusRepository } from '../../../domain/repositories/campus.repository.interface';
import { Campus, Building, PointOfInterest } from '../../../domain/entities/campus.entity';

@Injectable()
export class PrismaCampusRepository implements ICampusRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCampuses(): Promise<Campus[]> {
    const raw = await this.prisma.campus.findMany({
      include: {
        buildings: {
          include: { pois: true },
        },
      },
    });

    return raw.map((c) => {
      const buildings = c.buildings.map((b) => {
        const pois = b.pois.map(
          (p) => new PointOfInterest(p.id, p.name, p.type, p.latitude, p.longitude, p.buildingId, p.description, p.elevation),
        );
        return new Building(b.id, b.campusId, b.code, b.name, b.latitude, b.longitude, b.faculty, b.elevation, pois);
      });
      return new Campus(c.id, c.code, c.name, c.description, c.latitude, c.longitude, buildings);
    });
  }

  async getBuildings(campusId?: string): Promise<Building[]> {
    const raw = await this.prisma.building.findMany({
      where: { ...(campusId && { campusId }) },
      include: { pois: true },
    });

    return raw.map((b) => {
      const pois = b.pois.map(
        (p) => new PointOfInterest(p.id, p.name, p.type, p.latitude, p.longitude, p.buildingId, p.description, p.elevation),
      );
      return new Building(b.id, b.campusId, b.code, b.name, b.latitude, b.longitude, b.faculty, b.elevation, pois);
    });
  }

  async getPois(buildingId?: string): Promise<PointOfInterest[]> {
    const raw = await this.prisma.pointOfInterest.findMany({
      where: { ...(buildingId && { buildingId }) },
    });

    return raw.map(
      (p) => new PointOfInterest(p.id, p.name, p.type, p.latitude, p.longitude, p.buildingId, p.description, p.elevation),
    );
  }

  async findPoiById(id: string): Promise<PointOfInterest | null> {
    const p = await this.prisma.pointOfInterest.findUnique({ where: { id } });
    if (!p) return null;
    return new PointOfInterest(p.id, p.name, p.type, p.latitude, p.longitude, p.buildingId, p.description, p.elevation);
  }
}
