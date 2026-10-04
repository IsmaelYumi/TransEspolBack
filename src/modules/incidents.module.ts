import { Module } from '@nestjs/common';
import { IncidentsController } from '../presentation/controllers/incidents.controller';
import { ManageIncidentsUseCase } from '../application/use-cases/incidents/manage-incidents.use-case';

@Module({
  controllers: [IncidentsController],
  providers: [ManageIncidentsUseCase],
  exports: [ManageIncidentsUseCase],
})
export class IncidentsModule {}
