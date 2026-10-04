import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManageIncidentsUseCase } from '../../application/use-cases/incidents/manage-incidents.use-case';
import { CreateIncidentDto } from '../dtos/incidents/create-incident.dto';
import { UpdateIncidentStatusDto } from '../dtos/incidents/update-incident-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '../../domain/enums';
import { CurrentUser } from '../guards/current-user.decorator';
import { JwtPayload } from '../../application/ports/token.service.interface';
import { Request } from 'express';

@ApiTags('Incidencias Operativas (Averías, Retrasos, Bloqueos)')
@Controller('incidents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class IncidentsController {
  constructor(private readonly manageIncidentsUseCase: ManageIncidentsUseCase) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar incidencias abiertas o en progreso (Operador / Admin)' })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiResponse({ status: 200, description: 'Incidencias operativas activas' })
  async getOpenIncidents(@Query('routeId') routeId?: string) {
    return await this.manageIncidentsUseCase.getOpen(routeId);
  }

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar una nueva incidencia operativa (Operador / Admin)' })
  @ApiResponse({ status: 201, description: 'Incidencia registrada con auditoría' })
  async createIncident(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return await this.manageIncidentsUseCase.create({
      ...dto,
      createdById: user.sub,
      ipAddress: req.ip,
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de una incidencia (RESOLVED, IN_PROGRESS, CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Incidencia actualizada' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return await this.manageIncidentsUseCase.updateStatus(id, dto.status, user.sub, req.ip);
  }
}
