import { Module } from '@nestjs/common';
import { AlertsController } from '../presentation/controllers/alerts.controller';
import { ManageAlertsUseCase } from '../application/use-cases/alerts/manage-alerts.use-case';
import { TrackingModule } from './tracking.module';

@Module({
  imports: [TrackingModule],
  controllers: [AlertsController],
  providers: [ManageAlertsUseCase],
  exports: [ManageAlertsUseCase],
})
export class AlertsModule {}
