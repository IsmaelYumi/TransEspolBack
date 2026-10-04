import { Schedule } from '../entities/schedule.entity';

export interface IScheduleRepository {
  findByRoute(routeId: string): Promise<Schedule[]>;
  findAll(): Promise<Schedule[]>;
}

export const SCHEDULE_REPOSITORY_TOKEN = Symbol('IScheduleRepository');
