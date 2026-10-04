import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateVehicleLocationUseCase } from '../../application/use-cases/tracking/update-vehicle-location.use-case';
import { GetLiveLocationsUseCase } from '../../application/use-cases/tracking/get-live-locations.use-case';
import { UpdateLocationDto } from '../dtos/tracking/update-location.dto';

@ApiTags('Rastreo y Telemetría en Tiempo Real')
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly updateLocationUseCase: UpdateVehicleLocationUseCase,
    private readonly getLiveLocationsUseCase: GetLiveLocationsUseCase,
  ) {}

  @Post('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar telemetría GPS vía HTTP REST (Fallback de WebSockets)',
    description:
      'Permite a dispositivos IoT GPS instalados en las unidades o apps de conductores enviar coordenadas vía REST. Se actualiza en Redis y se emite a WebSockets.',
  })
  @ApiResponse({ status: 200, description: 'Coordenadas recibidas y cacheadas en Redis' })
  async updateLocation(@Body() dto: UpdateLocationDto) {
    const location = await this.updateLocationUseCase.execute({
      busId: dto.busId,
      routeId: dto.routeId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
    });

    return {
      success: true,
      data: location.toJSON(),
    };
  }

  @Get('live')
  @ApiOperation({
    summary: 'Obtener todas las coordenadas de buses activos en tiempo real',
    description: 'Consulta directamente la memoria caché de Redis para obtener ubicaciones recientes sin saturar PostgreSQL.',
  })
  @ApiQuery({ name: 'routeId', required: false, description: 'Filtrar por ID de ruta' })
  @ApiResponse({ status: 200, description: 'Listado de coordenadas activas' })
  async getLiveLocations(@Query('routeId') routeId?: string) {
    const locations = await this.getLiveLocationsUseCase.execute(routeId);
    return {
      count: locations.length,
      buses: locations.map((loc) => loc.toJSON()),
    };
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar buses cercanos mediante indexación espacial Redis GEO',
    description: 'Utiliza Redis GEORADIUS para encontrar buses en un radio geográfico específico.',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -2.1465 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: -79.9664 })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 2 })
  @ApiResponse({ status: 200, description: 'Buses en el radio solicitado' })
  async getNearbyBuses(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm = 2,
  ) {
    const locations = await this.getLiveLocationsUseCase.getNearby(
      Number(lat),
      Number(lng),
      Number(radiusKm),
    );
    return {
      radiusKm: Number(radiusKm),
      found: locations.length,
      buses: locations.map((loc) => loc.toJSON()),
    };
  }

  @Get('buses/:busId')
  @ApiOperation({ summary: 'Obtener la última coordenada temporal de un bus específico desde Redis' })
  @ApiResponse({ status: 200, description: 'Última coordenada registrada' })
  @ApiResponse({ status: 404, description: 'El bus no tiene coordenadas activas o expiró el TTL' })
  async getBusLocation(@Param('busId') busId: string) {
    const location = await this.getLiveLocationsUseCase.getBusLocation(busId);
    if (!location) {
      return {
        online: false,
        message: 'Bus sin señal GPS reciente o fuera de servicio.',
      };
    }
    return {
      online: true,
      data: location.toJSON(),
    };
  }
}
