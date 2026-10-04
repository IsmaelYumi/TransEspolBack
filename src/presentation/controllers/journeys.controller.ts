import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanJourneyUseCase } from '../../application/use-cases/journeys/plan-journey.use-case';
import { PlanJourneyDto } from '../dtos/journeys/plan-journey.dto';
import { Public } from '../guards/public.decorator';

@ApiTags('Planificación de Viajes (Journey Planning)')
@Controller('journeys')
export class JourneysController {
  constructor(private readonly planJourneyUseCase: PlanJourneyUseCase) {}

  @Public()
  @Post('plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar y planificar opciones de viaje entre origen y destino',
    description:
      'Identifica paradas cercanas, evalúa rutas directas compatibles, secuencias válidas y restricciones de recogida/bajada. Informa disponibilidad de telemetría en tiempo real sin inventar tiempos ficticios.',
  })
  @ApiResponse({ status: 200, description: 'Opciones de viaje recomendadas y alternativas' })
  @ApiResponse({ status: 400, description: 'Coordenadas o POIs inválidos' })
  async planJourney(@Body() dto: PlanJourneyDto) {
    return await this.planJourneyUseCase.execute(dto);
  }
}
