import { Module } from '@nestjs/common';
import { ServiceStatusController } from '../presentation/controllers/service-status.controller';
import { ManageServiceStatusUseCase } from '../application/use-cases/service-status/manage-service-status.use-case';
import { TrackingModule } from './tracking.module';

@Module({
  imports: [TrackingModule],
  controllers: [ServiceStatusController],
  providers: [ManageServiceStatusUseCase],
  exports: [ManageServiceStatusUseCase],
})
export class ServiceStatusModule {}
