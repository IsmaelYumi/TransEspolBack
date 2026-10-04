import { Module } from '@nestjs/common';
import { JourneysController } from '../presentation/controllers/journeys.controller';
import { PlanJourneyUseCase } from '../application/use-cases/journeys/plan-journey.use-case';

@Module({
  controllers: [JourneysController],
  providers: [PlanJourneyUseCase],
  exports: [PlanJourneyUseCase],
})
export class JourneysModule {}
