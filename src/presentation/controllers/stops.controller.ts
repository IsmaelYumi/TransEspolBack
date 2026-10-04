import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetStopsUseCase } from '../../application/use-cases/stops/get-stops.use-case';
import { Public } from '../guards/public.decorator';

@ApiTags('Paradas (Stops)')
@Controller('stops')
export class StopsController {
  constructor(private readonly getStopsUseCase: GetStopsUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todas las paradas activas del campus' })
  @ApiResponse({ status: 200, description: 'Listado de paradas activas' })
  async getStops() {
    return await this.getStopsUseCase.getActive();
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Buscar paradas cercanas a una ubicación geográfica (lat/lng)' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: -2.1465 })
  @ApiQuery({ name: 'lng', required: true, type: Number, example: -79.9664 })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 1.0 })
  async getNearbyStops(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm = 1.0,
  ) {
    return await this.getStopsUseCase.findNearby(Number(lat), Number(lng), Number(radiusKm));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de una parada por ID' })
  @ApiResponse({ status: 200, description: 'Datos de la parada' })
  @ApiResponse({ status: 404, description: 'Parada no encontrada' })
  async getStopById(@Param('id') id: string) {
    return await this.getStopsUseCase.getById(id);
  }
}
