import { Module } from '@nestjs/common';
import { SchedulesController } from '../presentation/controllers/schedules.controller';
import { GetSchedulesUseCase } from '../application/use-cases/schedules/get-schedules.use-case';

@Module({
  controllers: [SchedulesController],
  providers: [GetSchedulesUseCase],
  exports: [GetSchedulesUseCase],
})
export class SchedulesModule {}
