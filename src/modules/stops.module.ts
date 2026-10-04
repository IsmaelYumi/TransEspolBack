import { Module } from '@nestjs/common';
import { StopsController } from '../presentation/controllers/stops.controller';
import { GetStopsUseCase } from '../application/use-cases/stops/get-stops.use-case';

@Module({
  controllers: [StopsController],
  providers: [GetStopsUseCase],
  exports: [GetStopsUseCase],
})
export class StopsModule {}
