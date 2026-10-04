import { Module } from '@nestjs/common';
import { RoutesController } from '../presentation/controllers/routes.controller';
import { GetRoutesUseCase } from '../application/use-cases/routes/get-routes.use-case';
import { GetRouteDetailUseCase } from '../application/use-cases/routes/get-route-detail.use-case';
import { CreateRouteUseCase } from '../application/use-cases/routes/create-route.use-case';

@Module({
  controllers: [RoutesController],
  providers: [
    GetRoutesUseCase,
    GetRouteDetailUseCase,
    CreateRouteUseCase,
  ],
  exports: [
    GetRoutesUseCase,
    GetRouteDetailUseCase,
  ],
})
export class RoutesModule {}
