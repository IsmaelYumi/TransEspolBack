import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCampusUseCase } from '../../application/use-cases/campus/get-campus.use-case';
import { Public } from '../guards/public.decorator';

@ApiTags('Campus y Puntos de Interés')
@Controller('campus')
export class CampusController {
  constructor(private readonly getCampusUseCase: GetCampusUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener sedes y campus de ESPOL con sus edificios' })
  @ApiResponse({ status: 200, description: 'Listado de campus' })
  async getCampuses() {
    return await this.getCampusUseCase.getCampuses();
  }

  @Public()
  @Get('buildings')
  @ApiOperation({ summary: 'Listar facultades y edificios del campus' })
  @ApiQuery({ name: 'campusId', required: false })
  async getBuildings(@Query('campusId') campusId?: string) {
    return await this.getCampusUseCase.getBuildings(campusId);
  }

  @Public()
  @Get('pois')
  @ApiOperation({ summary: 'Listar puntos de interés (laboratorios, rectorado, gimnasio, auditorios)' })
  @ApiQuery({ name: 'buildingId', required: false })
  async getPois(@Query('buildingId') buildingId?: string) {
    return await this.getCampusUseCase.getPois(buildingId);
  }
}
