import { Inject, Injectable } from '@nestjs/common';
import { IScheduleRepository, SCHEDULE_REPOSITORY_TOKEN } from '../../../domain/repositories/schedule.repository.interface';
import { Schedule } from '../../../domain/entities/schedule.entity';

@Injectable()
export class GetSchedulesUseCase {
  constructor(
    @Inject(SCHEDULE_REPOSITORY_TOKEN)
    private readonly scheduleRepository: IScheduleRepository,
  ) {}

  async getByRoute(routeId: string): Promise<Schedule[]> {
    return await this.scheduleRepository.findByRoute(routeId);
  }

  async getAll(): Promise<Schedule[]> {
    return await this.scheduleRepository.findAll();
  }
}
