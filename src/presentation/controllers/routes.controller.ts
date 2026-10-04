import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetRoutesUseCase } from '../../application/use-cases/routes/get-routes.use-case';
import { GetRouteDetailUseCase } from '../../application/use-cases/routes/get-route-detail.use-case';
import { CreateRouteUseCase } from '../../application/use-cases/routes/create-route.use-case';
import { CreateRouteDto } from '../dtos/routes/create-route.dto';
import { RouteStatus, UserRole } from '../../domain/enums';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('Rutas y Paradas')
@Controller('routes')
export class RoutesController {
  constructor(
    private readonly getRoutesUseCase: GetRoutesUseCase,
    private readonly getRouteDetailUseCase: GetRouteDetailUseCase,
    private readonly createRouteUseCase: CreateRouteUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todas las rutas de transporte ESPOL',
    description: 'Retorna las líneas de transporte activas con sus respectivas paradas ordenadas.',
  })
  @ApiQuery({ name: 'status', enum: RouteStatus, required: false })
  @ApiResponse({ status: 200, description: 'Listado de rutas' })
  async getRoutes(@Query('status') status?: RouteStatus) {
    return await this.getRoutesUseCase.execute(status);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle de ruta con coordenadas de buses en vivo',
    description:
      'Retorna información de la ruta, lista de paradas y los buses actualmente en tránsito obtenidos desde la caché de Redis.',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la ruta y buses activos' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
  async getRouteDetail(@Param('id') id: string) {
    return await this.getRouteDetailUseCase.execute(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una nueva ruta (Solo Administrador)',
    description: 'Permite a los administradores de transporte registrar un nuevo recorrido.',
  })
  @ApiResponse({ status: 201, description: 'Ruta creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Código de ruta ya registrado' })
  async createRoute(@Body() dto: CreateRouteDto) {
    return await this.createRouteUseCase.execute(dto);
  }
}
