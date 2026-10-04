import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IngestTelemetryUseCase } from '../../application/use-cases/telemetry/ingest-telemetry.use-case';
import { IngestTelemetryDto } from '../dtos/telemetry/ingest-telemetry.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserRole } from '../../domain/enums';

@ApiTags('Capa de Ingesta de Telemetría (GPS / AVL / Sensores)')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly ingestTelemetryUseCase: IngestTelemetryUseCase) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ingesta agnóstica de coordenadas y telemetría de vehículos (GPS/AVL)',
    description:
      'Punto de entrada desacoplado para hardware embarcado, dispositivos GPS y fuentes externas. Valida fuente, vehículo y coordenadas, almacena en Redis (TTL 120s) y retransmite vía WebSockets.',
  })
  @ApiResponse({ status: 202, description: 'Telemetría aceptada y procesada' })
  @ApiResponse({ status: 400, description: 'Vehículo inexistente o coordenadas fuera de rango' })
  async ingest(@Body() dto: IngestTelemetryDto) {
    return await this.ingestTelemetryUseCase.execute(dto);
  }
}
