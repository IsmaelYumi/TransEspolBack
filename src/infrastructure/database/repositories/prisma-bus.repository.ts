import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IBusRepository } from '../../../domain/repositories/bus.repository.interface';
import { Bus } from '../../../domain/entities/bus.entity';
import { BusStatus, VehicleStatus, TripStatus } from '../../../domain/enums';
import { Vehicle as PrismaVehicleModel } from '@prisma/client';

@Injectable()
export class PrismaBusRepository implements IBusRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaVehicleModel & { trips?: any[] }): Bus {
    const activeTrip = raw.trips && raw.trips.length > 0 ? raw.trips[0] : null;

    return new Bus(
      raw.id,
      raw.plate,
      raw.internalCode,
      raw.capacity,
      raw.status as BusStatus,
      raw.status !== VehicleStatus.OUT_OF_SERVICE,
      activeTrip?.driverId ?? null,
      activeTrip?.routeId ?? null,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  async findById(id: string): Promise<Bus | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          where: { status: TripStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });
    return vehicle ? this.toDomain(vehicle) : null;
  }

  async findByPlate(plateNumber: string): Promise<Bus | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: plateNumber.toUpperCase().trim() },
      include: {
        trips: {
          where: { status: TripStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });
    return vehicle ? this.toDomain(vehicle) : null;
  }

  async findByUnitNumber(unitNumber: string): Promise<Bus | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { internalCode: unitNumber.toUpperCase().trim() },
      include: {
        trips: {
          where: { status: TripStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });
    return vehicle ? this.toDomain(vehicle) : null;
  }

  async findByDriverId(driverId: string): Promise<Bus | null> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        driverId,
        status: TripStatus.IN_PROGRESS,
      },
      include: { vehicle: true },
    });
    return trip ? this.toDomain({ ...trip.vehicle, trips: [trip] }) : null;
  }

  async findAll(): Promise<Bus[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      orderBy: { internalCode: 'asc' },
      include: {
        trips: {
          where: { status: TripStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });
    return vehicles.map((v) => this.toDomain(v));
  }

  async findActiveOnRoute(routeId?: string): Promise<Bus[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        status: VehicleStatus.IN_SERVICE,
        ...(routeId && {
          trips: {
            some: {
              routeId,
              status: TripStatus.IN_PROGRESS,
            },
          },
        }),
      },
      include: {
        trips: {
          where: { status: TripStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });
    return vehicles.map((v) => this.toDomain(v));
  }

  async create(
    data: Omit<Bus, 'id' | 'createdAt' | 'updatedAt' | 'isAvailable' | 'isOnRoute'>,
  ): Promise<Bus> {
    const created = await this.prisma.vehicle.create({
      data: {
        plate: data.plateNumber.toUpperCase().trim(),
        internalCode: data.unitNumber.toUpperCase().trim(),
        capacity: data.capacity,
        status: data.status as VehicleStatus,
      },
    });
    return this.toDomain(created);
  }

  async updateStatus(id: string, status: BusStatus): Promise<Bus> {
    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: { status: status as VehicleStatus },
      include: {
        trips: {
          where: { status: TripStatus.IN_PROGRESS },
          take: 1,
        },
      },
    });
    return this.toDomain(updated);
  }

  async assignRouteAndDriver(
    id: string,
    routeId: string | null,
    driverId: string | null,
  ): Promise<Bus> {
    // 1. Mark previous active trips for this vehicle as COMPLETED
    await this.prisma.trip.updateMany({
      where: {
        vehicleId: id,
        status: TripStatus.IN_PROGRESS,
      },
      data: {
        status: TripStatus.COMPLETED,
        actualEnd: new Date(),
      },
    });

    // 2. If routeId is provided, create a new active Trip
    if (routeId) {
      await this.prisma.trip.create({
        data: {
          vehicleId: id,
          routeId,
          driverId: driverId ?? null,
          serviceDate: new Date(),
          scheduledStart: new Date(),
          actualStart: new Date(),
          status: TripStatus.IN_PROGRESS,
        },
      });

      await this.prisma.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.IN_SERVICE },
      });
    } else {
      await this.prisma.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.AVAILABLE },
      });
    }

    return (await this.findById(id))!;
  }
}
