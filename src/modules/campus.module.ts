import { Module } from '@nestjs/common';
import { CampusController } from '../presentation/controllers/campus.controller';
import { GetCampusUseCase } from '../application/use-cases/campus/get-campus.use-case';

@Module({
  controllers: [CampusController],
  providers: [GetCampusUseCase],
  exports: [GetCampusUseCase],
})
export class CampusModule {}
