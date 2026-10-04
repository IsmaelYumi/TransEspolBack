import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManageAlertsUseCase } from '../../application/use-cases/alerts/manage-alerts.use-case';
import { CreateAlertDto } from '../dtos/alerts/create-alert.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '../../domain/enums';
import { CurrentUser } from '../guards/current-user.decorator';
import { JwtPayload } from '../../application/ports/token.service.interface';
import { Public } from '../guards/public.decorator';
import { Request } from 'express';

@ApiTags('Alertas y Notificaciones de Servicio')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly manageAlertsUseCase: ManageAlertsUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consultar alertas activas vigentes (Público / Pasajeros)' })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiResponse({ status: 200, description: 'Listado de alertas activas' })
  async getActiveAlerts(@Query('routeId') routeId?: string) {
    return await this.manageAlertsUseCase.getActive(routeId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar una nueva alerta operativa (Operador / Admin)' })
  @ApiResponse({ status: 201, description: 'Alerta creada y difundida en tiempo real' })
  async createAlert(
    @Body() dto: CreateAlertDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return await this.manageAlertsUseCase.create({
      ...dto,
      createdById: user.sub,
      ipAddress: req.ip,
    });
  }

  @Patch(':id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver / desactivar una alerta (Operador / Admin)' })
  @ApiResponse({ status: 200, description: 'Alerta resuelta' })
  async resolveAlert(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return await this.manageAlertsUseCase.resolve(id, user.sub, req.ip);
  }
}
