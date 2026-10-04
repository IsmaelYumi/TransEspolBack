import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManageServiceStatusUseCase } from '../../application/use-cases/service-status/manage-service-status.use-case';
import { CreateServiceStatusDto } from '../dtos/service-status/create-service-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '../../domain/enums';
import { CurrentUser } from '../guards/current-user.decorator';
import { JwtPayload } from '../../application/ports/token.service.interface';
import { Public } from '../guards/public.decorator';
import { Request } from 'express';

@ApiTags('Estado Operacional del Servicio (Service Status)')
@Controller('service-status')
export class ServiceStatusController {
  constructor(private readonly manageServiceStatusUseCase: ManageServiceStatusUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consultar estado operacional del servicio (Público / Pasajeros)' })
  @ApiResponse({ status: 200, description: 'Estado actual del sistema y rutas' })
  async getStatus() {
    return await this.manageServiceStatusUseCase.getLatest();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar o actualizar el estado del servicio (Operador / Admin)' })
  @ApiResponse({ status: 201, description: 'Estado actualizado y difundido' })
  async createStatus(
    @Body() dto: CreateServiceStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return await this.manageServiceStatusUseCase.create({
      ...dto,
      actorId: user.sub,
      ipAddress: req.ip,
    });
  }
}
