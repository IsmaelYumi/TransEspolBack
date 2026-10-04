import { describe, it, expect, vi } from 'vitest';
import { User } from '../src/domain/entities/user.entity';
import { UserRole, BusStatus, RouteDirection, RouteServiceType, RouteStatus, StopStatus, StopType } from '../src/domain/enums';
import { VehicleLocation } from '../src/domain/entities/vehicle-location.entity';
import { UpdateVehicleLocationUseCase } from '../src/application/use-cases/tracking/update-vehicle-location.use-case';
import { PlanJourneyUseCase } from '../src/application/use-cases/journeys/plan-journey.use-case';
import { ITrackingCacheRepository } from '../src/domain/repositories/tracking-cache.repository.interface';
import { IBusRepository } from '../src/domain/repositories/bus.repository.interface';
import { IEventPublisher } from '../src/application/ports/event-publisher.service.interface';
import { Bus } from '../src/domain/entities/bus.entity';
import { Stop } from '../src/domain/entities/stop.entity';
import { Route } from '../src/domain/entities/route.entity';

describe('Domain Entities & Business Rules', () => {
  it('should validate institutional email with @espol.edu.ec domain', () => {
    expect(User.isInstitutionalEmail('iyumi@espol.edu.ec')).toBe(true);
    expect(User.isInstitutionalEmail('estudiante@fiec.espol.edu.ec')).toBe(true);
    expect(User.isInstitutionalEmail('random.user@gmail.com')).toBe(false);
    expect(User.isInstitutionalEmail('attacker@evil.com')).toBe(false);
    expect(User.isInstitutionalEmail('')).toBe(false);
  });

  it('should detect stale coordinates exceeding TTL (120s threshold)', () => {
    const freshLocation = new VehicleLocation('bus-1', 'route-1', -2.1465, -79.9664, 30, 90, 5, new Date());
    expect(freshLocation.isStale(120)).toBe(false);

    const oldDate = new Date(Date.now() - 150 * 1000); // 150s ago (> 120s)
    const staleLocation = new VehicleLocation('bus-1', 'route-1', -2.1465, -79.9664, 30, 90, 5, oldDate);
    expect(staleLocation.isStale(120)).toBe(true);
  });

  it('should verify passenger role is strictly read-only', () => {
    const passenger = new User('usr-1', 'estudiante@espol.edu.ec', 'Estudiante ESPOL', UserRole.PASSENGER);
    expect(passenger.isPassenger()).toBe(true);
    expect(passenger.isDriver()).toBe(false);
    expect(passenger.isAdmin()).toBe(false);
  });
});

describe('UpdateVehicleLocationUseCase', () => {
  it('should cache coordinates in Redis and publish WebSocket event', async () => {
    const mockBus = new Bus('bus-123', 'GAA-1004', 'DISCO-04', 50, BusStatus.IDLE, true, 'driver-1', 'route-abc');

    const mockTrackingCache: ITrackingCacheRepository = {
      saveLocation: vi.fn().mockResolvedValue(undefined),
      getLocation: vi.fn(),
      getAllLocations: vi.fn(),
      getLocationsByRoute: vi.fn(),
      removeLocation: vi.fn(),
      findNearbyBuses: vi.fn(),
    };

    const mockBusRepo: IBusRepository = {
      findById: vi.fn().mockResolvedValue(mockBus),
      findByPlate: vi.fn(),
      findByUnitNumber: vi.fn(),
      findByDriverId: vi.fn(),
      findAll: vi.fn(),
      findActiveOnRoute: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue(mockBus),
      assignRouteAndDriver: vi.fn(),
    };

    const mockEventPublisher: IEventPublisher = {
      publishLocationUpdate: vi.fn(),
      publishBusStatusChange: vi.fn(),
    };

    const mockPrisma: any = {
      vehiclePosition: {
        create: vi.fn().mockResolvedValue({ id: 'pos-1' }),
      },
    };

    const useCase = new UpdateVehicleLocationUseCase(
      mockTrackingCache,
      mockBusRepo,
      mockEventPublisher,
      mockPrisma,
    );

    const result = await useCase.execute({
      busId: 'bus-123',
      routeId: 'route-abc',
      latitude: -2.1465,
      longitude: -79.9664,
      speed: 35.0,
      heading: 180,
    });

    expect(result.busId).toBe('bus-123');
    expect(result.latitude).toBe(-2.1465);
    expect(mockTrackingCache.saveLocation).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publishLocationUpdate).toHaveBeenCalledTimes(1);
    expect(mockBusRepo.updateStatus).toHaveBeenCalledWith('bus-123', BusStatus.ON_ROUTE);
  });
});

describe('PlanJourneyUseCase (ESPOL Move Alert Rule: Rutas atómicas, sin inventar tiempos)', () => {
  it('should plan direct journey between stops and declare real-time availability', async () => {
    const stopGarita = new Stop('st-1', 'Garita Perimetral', -2.1445, -79.9650, 'ST-01', '', StopType.SHELTER, StopStatus.ACTIVE, null, null, 1, true, false, 0);
    const stopFiec = new Stop('st-2', 'FIEC / CIDIS', -2.1465, -79.9664, 'ST-02', '', StopType.STANDARD, StopStatus.ACTIVE, null, null, 2, true, true, 300);

    const mockRoute = new Route(
      'route-1',
      'R-ENTRADA-NORMAL',
      'Entrada Normal',
      'Ruta de ingreso',
      RouteDirection.INBOUND,
      RouteServiceType.NORMAL,
      '#003366',
      RouteStatus.ACTIVE,
      null,
      [stopGarita, stopFiec],
    );

    const mockStopRepo: any = {
      findActive: vi.fn().mockResolvedValue([stopGarita, stopFiec]),
    };

    const mockRouteRepo: any = {
      findAll: vi.fn().mockResolvedValue([mockRoute]),
    };

    const mockTrackingCache: any = {
      getLocationsByRoute: vi.fn().mockResolvedValue([]), // No live telemetry active
    };

    const mockScheduleRepo: any = {
      findByRoute: vi.fn().mockResolvedValue([]),
    };

    const mockCampusRepo: any = {
      findPoiById: vi.fn().mockResolvedValue(null),
    };

    const mockServiceStatusRepo: any = {
      getLatest: vi.fn().mockResolvedValue([{ status: 'NORMAL' }]),
    };

    const useCase = new PlanJourneyUseCase(
      mockStopRepo,
      mockRouteRepo,
      mockTrackingCache,
      mockScheduleRepo,
      mockCampusRepo,
      mockServiceStatusRepo,
    );

    const result = await useCase.execute({
      originLat: -2.1445,
      originLng: -79.9650,
      destLat: -2.1465,
      destLng: -79.9664,
    });

    expect(result.success).toBe(true);
    expect(result.recommendedOption.route.code).toBe('R-ENTRADA-NORMAL');
    // Notice: Real-time is false, notice explains it without inventing fake times!
    expect(result.recommendedOption.realTimeAvailable).toBe(false);
    expect(result.recommendedOption.estimatedArrivalNotice).toContain('Tiempo real no disponible');
  });
});

describe('AuthModule Dependency Injection', () => {
  it('should compile AuthModule and resolve WsJwtGuard dependencies without error', async () => {
    const { Test } = await import('@nestjs/testing');
    const { AuthModule } = await import('../src/modules/auth.module');
    const { ConfigModule } = await import('@nestjs/config');
    const { USER_REPOSITORY_TOKEN } = await import('../src/domain/repositories/user.repository.interface');
    const { WsJwtGuard } = await import('../src/infrastructure/auth/ws-jwt.guard');

    const { Global, Module } = await import('@nestjs/common');

    @Global()
    @Module({
      providers: [
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            findByEmail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          },
        },
      ],
      exports: [USER_REPOSITORY_TOKEN],
    })
    class MockDbModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MockDbModule,
        AuthModule,
      ],
    }).compile();

    expect(moduleRef).toBeDefined();
    const guard = moduleRef.get(WsJwtGuard);
    expect(guard).toBeDefined();
  });
});

