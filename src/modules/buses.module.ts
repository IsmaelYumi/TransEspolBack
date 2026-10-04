import { Module } from '@nestjs/common';
import { BusesController } from '../presentation/controllers/buses.controller';
import { ManageBusesUseCase } from '../application/use-cases/buses/manage-buses.use-case';
import { TrackingModule } from './tracking.module';

@Module({
  imports: [TrackingModule],
  controllers: [BusesController],
  providers: [ManageBusesUseCase],
  exports: [ManageBusesUseCase],
})
export class BusesModule {}
