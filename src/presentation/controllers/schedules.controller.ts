import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetSchedulesUseCase } from '../../application/use-cases/schedules/get-schedules.use-case';
import { Public } from '../guards/public.decorator';

@ApiTags('Horarios Programados (Schedules)')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly getSchedulesUseCase: GetSchedulesUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consultar todos los horarios programados del sistema' })
  @ApiResponse({ status: 200, description: 'Horarios vigentes' })
  async getAllSchedules() {
    return await this.getSchedulesUseCase.getAll();
  }

  @Public()
  @Get('routes/:routeId')
  @ApiOperation({ summary: 'Consultar horarios programados de una ruta específica' })
  @ApiResponse({ status: 200, description: 'Horarios por día para la ruta solicitada' })
  async getByRoute(@Param('routeId') routeId: string) {
    return await this.getSchedulesUseCase.getByRoute(routeId);
  }
}
