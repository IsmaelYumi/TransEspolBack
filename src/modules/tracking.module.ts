import { Module, forwardRef } from '@nestjs/common';
import { TrackingGateway } from '../presentation/gateways/tracking.gateway';
import { TrackingController } from '../presentation/controllers/tracking.controller';
import { UpdateVehicleLocationUseCase } from '../application/use-cases/tracking/update-vehicle-location.use-case';
import { GetLiveLocationsUseCase } from '../application/use-cases/tracking/get-live-locations.use-case';
import { EVENT_PUBLISHER_TOKEN } from '../application/ports/event-publisher.service.interface';
import { AuthModule } from './auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [TrackingController],
  providers: [
    TrackingGateway,
    UpdateVehicleLocationUseCase,
    GetLiveLocationsUseCase,
    {
      provide: EVENT_PUBLISHER_TOKEN,
      useExisting: TrackingGateway,
    },
  ],
  exports: [
    TrackingGateway,
    UpdateVehicleLocationUseCase,
    GetLiveLocationsUseCase,
    EVENT_PUBLISHER_TOKEN,
  ],
})
export class TrackingModule {}
