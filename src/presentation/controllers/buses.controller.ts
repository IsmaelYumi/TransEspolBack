import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManageBusesUseCase } from '../../application/use-cases/buses/manage-buses.use-case';
import { AssignBusDto } from '../dtos/buses/assign-bus.dto';
import { UpdateBusStatusDto } from '../dtos/buses/update-bus-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '../../domain/enums';

@ApiTags('Flota de Buses')
@Controller('buses')
export class BusesController {
  constructor(private readonly manageBusesUseCase: ManageBusesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar la flota completa de buses de ESPOL',
    description: 'Retorna todas las unidades vehiculares, placas, capacidad y estados.',
  })
  @ApiResponse({ status: 200, description: 'Listado de unidades' })
  async getBuses() {
    return await this.manageBusesUseCase.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de un bus por ID' })
  @ApiResponse({ status: 200, description: 'Datos del bus' })
  @ApiResponse({ status: 404, description: 'Bus no encontrado' })
  async getBus(@Param('id') id: string) {
    return await this.manageBusesUseCase.getById(id);
  }

  @Patch(':id/assign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Asignar conductor y/o ruta a un bus (Admin / Despachador)',
    description: 'Asigna operativamente un bus a una ruta y a un conductor institucional.',
  })
  @ApiResponse({ status: 200, description: 'Bus reasignado exitosamente' })
  async assignBus(@Param('id') id: string, @Body() dto: AssignBusDto) {
    return await this.manageBusesUseCase.assignDriverAndRoute(id, dto.routeId, dto.driverId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar estado operativo del bus (Admin / Conductor)',
    description: 'Cambia el estado de un bus entre IDLE, ON_ROUTE, MAINTENANCE u OFFLINE.',
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateBusStatusDto) {
    return await this.manageBusesUseCase.updateStatus(id, dto.status);
  }
}
