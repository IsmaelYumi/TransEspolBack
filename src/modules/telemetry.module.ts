import { Module } from '@nestjs/common';
import { TelemetryController } from '../presentation/controllers/telemetry.controller';
import { IngestTelemetryUseCase } from '../application/use-cases/telemetry/ingest-telemetry.use-case';
import { TrackingModule } from './tracking.module';

@Module({
  imports: [TrackingModule],
  controllers: [TelemetryController],
  providers: [IngestTelemetryUseCase],
  exports: [IngestTelemetryUseCase],
})
export class TelemetryModule {}
