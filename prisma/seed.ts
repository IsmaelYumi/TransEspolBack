import {
  PrismaClient,
  UserRole,
  StopType,
  StopStatus,
  RouteDirection,
  RouteServiceType,
  RouteStatus,
  DayOfWeek,
  ScheduleStatus,
  VehicleStatus,
  TripStatus,
  ServiceStatusType,
  AlertType,
  AlertPriority,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/transespol_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(' Seeding ESPOL MOVE ALERT - Mobility Backend...');

  // 1. Campus
  const campus = await prisma.campus.upsert({
    where: { code: 'PROSPERINA' },
    update: {},
    create: {
      code: 'PROSPERINA',
      name: 'Campus Gustavo Galindo Velasco (Prosperina)',
      description: 'Campus principal politécnico de ESPOL en Guayaquil, Km 30.5 Vía Perimetral',
      latitude: -2.1465,
      longitude: -79.9664,
    },
  });

  // 2. Users (Roles: PASSENGER, OPERATOR, ADMIN)
  const admin = await prisma.user.upsert({
    where: { email: 'admin.transporte@espol.edu.ec' },
    update: { role: UserRole.ADMIN },
    create: {
      email: 'admin.transporte@espol.edu.ec',
      name: 'Ing. Administrador de Movilidad ESPOL',
      role: UserRole.ADMIN,
      institutionalId: 'ADM-001',
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'conductor.transporte@espol.edu.ec' },
    update: { role: UserRole.OPERATOR },
    create: {
      email: 'conductor.transporte@espol.edu.ec',
      name: 'Manuel Gómez (Conductor Disco 04)',
      role: UserRole.OPERATOR,
      institutionalId: 'EMP-7712',
    },
  });

  const passenger = await prisma.user.upsert({
    where: { email: 'estudiante@espol.edu.ec' },
    update: { role: UserRole.PASSENGER },
    create: {
      email: 'estudiante@espol.edu.ec',
      name: 'Ismael Yumi (Pasajero / Estudiante FIEC)',
      role: UserRole.PASSENGER,
      institutionalId: '201912345',
    },
  });

  console.log(' Users seeded (Admin, Operator, Passenger)');

  // 3. Buildings & Points of Interest
  const buildingsData = [
    { code: 'EDIF-FIEC', name: 'Facultad de Ingeniería en Electricidad y Computación', faculty: 'FIEC', lat: -2.1465, lng: -79.9664 },
    { code: 'EDIF-FCNM', name: 'Facultad de Ciencias Naturales y Matemáticas', faculty: 'FCNM', lat: -2.1478, lng: -79.9675 },
    { code: 'EDIF-FCSH', name: 'Facultad de Ciencias Sociales y Humanísticas', faculty: 'FCSH', lat: -2.1480, lng: -79.9679 },
    { code: 'EDIF-FADCOM', name: 'Facultad de Arte, Diseño y Comunicación Audiovisual', faculty: 'FADCOM', lat: -2.1492, lng: -79.9688 },
    { code: 'EDIF-FCV', name: 'Facultad de Ciencias de la Vida', faculty: 'FCV', lat: -2.1455, lng: -79.9658 },
    { code: 'EDIF-RECTORADO', name: 'Edificio de Rectorado y Administración Central', faculty: 'ADMIN', lat: -2.1501, lng: -79.9692 },
    { code: 'EDIF-GIMNASIO', name: 'Complejo Deportivo y Gimnasio ESPOL', faculty: 'SPORTS', lat: -2.1462, lng: -79.9661 },
  ];

  for (const b of buildingsData) {
    const building = await prisma.building.upsert({
      where: { code: b.code },
      update: {},
      create: {
        campusId: campus.id,
        code: b.code,
        name: b.name,
        faculty: b.faculty,
        latitude: b.lat,
        longitude: b.lng,
      },
    });

    await prisma.pointOfInterest.upsert({
      where: { id: building.id }, // synthetic dummy match
      update: {},
      create: {
        buildingId: building.id,
        name: b.name,
        type: b.faculty === 'SPORTS' ? 'SPORTS' : 'FACULTY',
        latitude: b.lat,
        longitude: b.lng,
      },
    }).catch(() => {});
  }

  // 4. Stops (Paradas) with explicit coordinates and directions
  const stopsDef = [
    { code: 'ST-GARITA', name: 'Garita Entrada Perimetral', lat: -2.1445, lng: -79.9650, type: StopType.SHELTER },
    { code: 'ST-FCV', name: 'Parada FCV - Ciencias de la Vida', lat: -2.1456, lng: -79.9659, type: StopType.STANDARD },
    { code: 'ST-RECTORADO', name: 'Parada Rectorado / CELEX', lat: -2.1501, lng: -79.9692, type: StopType.STANDARD },
    { code: 'ST-FCNM', name: 'Parada FCNM (Entrada / Subida)', lat: -2.1478, lng: -79.9675, type: StopType.STANDARD },
    { code: 'ST-FCSH', name: 'Parada FCSH (Salida / Bajada - Frente a FCNM)', lat: -2.1480, lng: -79.9679, type: StopType.STANDARD },
    { code: 'ST-FIEC', name: 'Parada FIEC / CIDIS (Entrada / Subida)', lat: -2.1465, lng: -79.9664, type: StopType.STANDARD },
    { code: 'ST-GIMNASIO', name: 'Parada Gimnasio (Salida / Bajada - Frente a FIEC)', lat: -2.1462, lng: -79.9661, type: StopType.STANDARD },
    { code: 'ST-FADCOM', name: 'Parada FADCOM', lat: -2.1492, lng: -79.9688, type: StopType.STANDARD },
    { code: 'ST-TERMINAL', name: 'Terminal de Transferencia Interno', lat: -2.1520, lng: -79.9710, type: StopType.TERMINAL },
  ];

  const stopMap: Record<string, any> = {};
  for (const s of stopsDef) {
    const created = await prisma.stop.upsert({
      where: { code: s.code },
      update: {},
      create: {
        campusId: campus.id,
        code: s.code,
        name: s.name,
        latitude: s.lat,
        longitude: s.lng,
        type: s.type,
        status: StopStatus.ACTIVE,
      },
    });
    stopMap[s.code] = created;
  }

  console.log(' Stops seeded');

  // 5. Prototype Routes (4 Rutas Oficiales de la Especificación - Atómicas e independientes)
  // Ruta 1: ENTRADA — NORMAL (Garita -> FCV -> Rectorado -> FCNM -> FIEC -> Terminal)
  const rEntradaNormal = await prisma.route.upsert({
    where: { code: 'R-ENTRADA-NORMAL' },
    update: {},
    create: {
      code: 'R-ENTRADA-NORMAL',
      name: 'Entrada — Normal (Garita -> Terminal)',
      description: 'Recorrido regular de ingreso: Garita, FCV, Rectorado, FCNM, FIEC hacia Terminal',
      direction: RouteDirection.INBOUND,
      serviceType: RouteServiceType.NORMAL,
      colorHex: '#003366', // Azul ESPOL
      status: RouteStatus.ACTIVE,
    },
  });

  const rEntradaNormalStops = [
    { code: 'ST-GARITA', seq: 1, pickup: true, dropoff: false, offset: 0 },
    { code: 'ST-FCV', seq: 2, pickup: true, dropoff: true, offset: 180 },
    { code: 'ST-RECTORADO', seq: 3, pickup: true, dropoff: true, offset: 360 },
    { code: 'ST-FCNM', seq: 4, pickup: true, dropoff: true, offset: 540 },
    { code: 'ST-FIEC', seq: 5, pickup: true, dropoff: true, offset: 720 },
    { code: 'ST-TERMINAL', seq: 6, pickup: false, dropoff: true, offset: 900 },
  ];

  for (const item of rEntradaNormalStops) {
    await prisma.routeStop.upsert({
      where: { routeId_stopId: { routeId: rEntradaNormal.id, stopId: stopMap[item.code].id } },
      update: {},
      create: {
        routeId: rEntradaNormal.id,
        stopId: stopMap[item.code].id,
        sequence: item.seq,
        pickupAllowed: item.pickup,
        dropoffAllowed: item.dropoff,
        estimatedOffsetSeconds: item.offset,
      },
    });
  }

  // Ruta 2: ENTRADA — ALTERNA (Garita -> FCV -> FADCOM -> Terminal)
  const rEntradaAlterna = await prisma.route.upsert({
    where: { code: 'R-ENTRADA-ALTERNA' },
    update: {},
    create: {
      code: 'R-ENTRADA-ALTERNA',
      name: 'Entrada — Alterna (Garita -> FADCOM -> Terminal)',
      description: 'Recorrido alterno de ingreso directo hacia el sector de FADCOM y Terminal',
      direction: RouteDirection.INBOUND,
      serviceType: RouteServiceType.ALTERNATIVE,
      colorHex: '#006699',
      status: RouteStatus.ACTIVE,
    },
  });

  const rEntradaAlternaStops = [
    { code: 'ST-GARITA', seq: 1, pickup: true, dropoff: false, offset: 0 },
    { code: 'ST-FCV', seq: 2, pickup: true, dropoff: true, offset: 180 },
    { code: 'ST-FADCOM', seq: 3, pickup: true, dropoff: true, offset: 420 },
    { code: 'ST-TERMINAL', seq: 4, pickup: false, dropoff: true, offset: 600 },
  ];

  for (const item of rEntradaAlternaStops) {
    await prisma.routeStop.upsert({
      where: { routeId_stopId: { routeId: rEntradaAlterna.id, stopId: stopMap[item.code].id } },
      update: {},
      create: {
        routeId: rEntradaAlterna.id,
        stopId: stopMap[item.code].id,
        sequence: item.seq,
        pickupAllowed: item.pickup,
        dropoffAllowed: item.dropoff,
        estimatedOffsetSeconds: item.offset,
      },
    });
  }

  // Ruta 3: SALIDA — NORMAL (Terminal -> FADCOM -> FCV -> Garita)
  const rSalidaNormal = await prisma.route.upsert({
    where: { code: 'R-SALIDA-NORMAL' },
    update: {},
    create: {
      code: 'R-SALIDA-NORMAL',
      name: 'Salida — Normal (Terminal -> Garita)',
      description: 'Recorrido regular de salida desde Terminal pasando por FADCOM, FCV hacia Garita',
      direction: RouteDirection.OUTBOUND,
      serviceType: RouteServiceType.NORMAL,
      colorHex: '#008080',
      status: RouteStatus.ACTIVE,
    },
  });

  const rSalidaNormalStops = [
    { code: 'ST-TERMINAL', seq: 1, pickup: true, dropoff: false, offset: 0 },
    { code: 'ST-FADCOM', seq: 2, pickup: true, dropoff: true, offset: 180 },
    { code: 'ST-FCV', seq: 3, pickup: true, dropoff: true, offset: 420 },
    { code: 'ST-GARITA', seq: 4, pickup: false, dropoff: true, offset: 600 },
  ];

  for (const item of rSalidaNormalStops) {
    await prisma.routeStop.upsert({
      where: { routeId_stopId: { routeId: rSalidaNormal.id, stopId: stopMap[item.code].id } },
      update: {},
      create: {
        routeId: rSalidaNormal.id,
        stopId: stopMap[item.code].id,
        sequence: item.seq,
        pickupAllowed: item.pickup,
        dropoffAllowed: item.dropoff,
        estimatedOffsetSeconds: item.offset,
      },
    });
  }

  // Ruta 4: SALIDA — ALTERNATIVA (Gimnasio -> FCSH -> Rectorado -> FCV -> Garita)
  // Regla del documento: No recoge en Terminal. Recoge desde Gimnasio (frente a FIEC), FCSH (frente a FCNM), Rectorado, FCV.
  const rSalidaAlterna = await prisma.route.upsert({
    where: { code: 'R-SALIDA-ALTERNA' },
    update: {},
    create: {
      code: 'R-SALIDA-ALTERNA',
      name: 'Salida — Alternativa (Gimnasio -> Garita)',
      description: 'Recorrido alternativo de evacuación rápida. No recoge en Terminal; inicia recogida en Gimnasio y FCSH',
      direction: RouteDirection.OUTBOUND,
      serviceType: RouteServiceType.ALTERNATIVE,
      colorHex: '#D97706', // Ámbar / Alerta
      status: RouteStatus.ACTIVE,
    },
  });

  const rSalidaAlternaStops = [
    { code: 'ST-GIMNASIO', seq: 1, pickup: true, dropoff: false, offset: 0 },
    { code: 'ST-FCSH', seq: 2, pickup: true, dropoff: true, offset: 180 },
    { code: 'ST-RECTORADO', seq: 3, pickup: true, dropoff: true, offset: 360 },
    { code: 'ST-FCV', seq: 4, pickup: true, dropoff: true, offset: 540 },
    { code: 'ST-GARITA', seq: 5, pickup: false, dropoff: true, offset: 720 },
  ];

  for (const item of rSalidaAlternaStops) {
    await prisma.routeStop.upsert({
      where: { routeId_stopId: { routeId: rSalidaAlterna.id, stopId: stopMap[item.code].id } },
      update: {},
      create: {
        routeId: rSalidaAlterna.id,
        stopId: stopMap[item.code].id,
        sequence: item.seq,
        pickupAllowed: item.pickup,
        dropoffAllowed: item.dropoff,
        estimatedOffsetSeconds: item.offset,
      },
    });
  }

  console.log(' 4 Prototype Routes and Stops seeded with operational rules');

  // 6. Schedules (Lunes a Viernes)
  const weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
  for (const day of weekdays) {
    await prisma.schedule.upsert({
      where: { id: `sched-ent-norm-${day.toLowerCase()}` },
      update: {},
      create: {
        id: `sched-ent-norm-${day.toLowerCase()}`,
        routeId: rEntradaNormal.id,
        dayOfWeek: day,
        startTime: '06:30',
        endTime: '20:30',
        frequencyMinutes: 15,
        status: ScheduleStatus.ACTIVE,
      },
    }).catch(() => {});
  }

  // 7. Vehicles & Trips
  const v1 = await prisma.vehicle.upsert({
    where: { internalCode: 'DISCO-04' },
    update: {},
    create: {
      internalCode: 'DISCO-04',
      plate: 'GAA-1004',
      capacity: 50,
      status: VehicleStatus.IN_SERVICE,
    },
  });

  await prisma.vehicle.upsert({
    where: { internalCode: 'DISCO-08' },
    update: {},
    create: {
      internalCode: 'DISCO-08',
      plate: 'GAA-1008',
      capacity: 45,
      status: VehicleStatus.AVAILABLE,
    },
  });

  const today = new Date();
  await prisma.trip.create({
    data: {
      routeId: rEntradaNormal.id,
      vehicleId: v1.id,
      driverId: operator.id,
      serviceDate: today,
      scheduledStart: today,
      actualStart: today,
      status: TripStatus.IN_PROGRESS,
    },
  }).catch(() => {});

  // 8. Initial Service Status & Alert
  await prisma.serviceStatusRecord.create({
    data: {
      scope: 'SYSTEM',
      status: ServiceStatusType.NORMAL,
      title: 'Servicio de Movilidad Operando Regularmente',
      description: 'Todas las rutas de entrada y salida operan en sus frecuencias habituales.',
    },
  }).catch(() => {});

  await prisma.alert.create({
    data: {
      type: AlertType.SERVICE_NOTICE,
      priority: AlertPriority.LOW,
      title: 'Bienvenido al Sistema de Movilidad ESPOL Move Alert',
      message: 'Consulte las rutas y horarios de llegada en tiempo real en paradas autorizadas.',
      routeId: rEntradaNormal.id,
      createdById: admin.id,
    },
  }).catch(() => {});

  console.log(' Fleet, Trip, Service Status, and Alerts seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
