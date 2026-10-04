import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { forwardRef, Inject, Injectable, Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { IEventPublisher } from '../../application/ports/event-publisher.service.interface';
import { VehicleLocation } from '../../domain/entities/vehicle-location.entity';
import { BusStatus, UserRole } from '../../domain/enums';
import { UpdateLocationDto } from '../dtos/tracking/update-location.dto';
import { SubscribeRouteDto } from '../dtos/tracking/subscribe-route.dto';
import { UpdateVehicleLocationUseCase } from '../../application/use-cases/tracking/update-vehicle-location.use-case';
import { GetLiveLocationsUseCase } from '../../application/use-cases/tracking/get-live-locations.use-case';
import { WsGlobalExceptionFilter } from '../filters/ws-exception.filter';

@Injectable()
@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@UseFilters(WsGlobalExceptionFilter)
export class TrackingGateway
  implements IEventPublisher, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    @Inject(forwardRef(() => UpdateVehicleLocationUseCase))
    private readonly updateLocationUseCase: UpdateVehicleLocationUseCase,
    @Inject(forwardRef(() => GetLiveLocationsUseCase))
    private readonly getLiveLocationsUseCase: GetLiveLocationsUseCase,
  ) {}

  afterInit() {
    this.logger.log(' WebSocket Gateway initialized on namespace: /tracking');
  }

  handleConnection(client: Socket) {
    this.logger.log(` Client connected: ${client.id} (Transport: ${client.conn.transport.name})`);
    client.emit('connected', {
      status: 'ok',
      message: 'Conectado al servidor de rastreo satelital ESPOL',
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(` Client disconnected: ${client.id}`);
  }

  /**
   * Mobile client subscribes to a specific route room (e.g. "Ruta Prosperina")
   */
  @SubscribeMessage('route:subscribe')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleSubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SubscribeRouteDto,
  ) {
    const roomName = `route:${dto.routeId}`;
    await client.join(roomName);
    this.logger.log(`Client ${client.id} joined room ${roomName}`);

    // Immediately fetch latest coordinates from Redis cache so the map loads instant state
    const liveBuses = await this.getLiveLocationsUseCase.execute(dto.routeId);

    client.emit('route:initial_state', {
      routeId: dto.routeId,
      buses: liveBuses.map((b) => b.toJSON()),
      timestamp: new Date().toISOString(),
    });

    return { event: 'subscribed', room: roomName, activeCount: liveBuses.length };
  }

  /**
   * Mobile client unsubscribes from a route room
   */
  @SubscribeMessage('route:unsubscribe')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleUnsubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SubscribeRouteDto,
  ) {
    const roomName = `route:${dto.routeId}`;
    await client.leave(roomName);
    this.logger.log(`Client ${client.id} left room ${roomName}`);
    return { event: 'unsubscribed', room: roomName };
  }

  /**
   * Driver sends real-time GPS telemetry from mobile app
   */
  @SubscribeMessage('location:send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateLocationDto,
  ) {
    // Los usuarios normales (estudiantes) solo tienen permisos de visualización de rutas
    if (client.data?.user?.role === UserRole.STUDENT) {
      throw new WsException('Acceso denegado: Los usuarios solo pueden visualizar las rutas y coordenadas en tiempo real.');
    }

    // Process update through Clean Architecture use case (persists to Redis + DB audit)
    const location = await this.updateLocationUseCase.execute({
      busId: dto.busId,
      routeId: dto.routeId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      driverId: client.data?.user?.sub,
    });

    return {
      status: 'acknowledged',
      busId: location.busId,
      timestamp: location.timestamp,
    };
  }

  /**
   * Heartbeat / Ping from mobile app
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  // Implementation of IEventPublisher (Application Port)
  publishLocationUpdate(location: VehicleLocation): void {
    if (!this.server) return;

    const payload = location.toJSON();

    // 1. Broadcast to route-specific room
    if (location.routeId) {
      this.server.to(`route:${location.routeId}`).emit('location:broadcast', payload);
    }

    // 2. Broadcast to global fleet oversight room (Admin/Dispatcher dashboard)
    this.server.to('fleet:all').emit('location:broadcast', payload);
  }

  publishBusStatusChange(busId: string, status: BusStatus, routeId?: string | null): void {
    if (!this.server) return;

    const payload = {
      busId,
      status,
      routeId,
      timestamp: new Date().toISOString(),
    };

    if (routeId) {
      this.server.to(`route:${routeId}`).emit('bus:status', payload);
    }
    this.server.to('fleet:all').emit('bus:status', payload);
  }
}
