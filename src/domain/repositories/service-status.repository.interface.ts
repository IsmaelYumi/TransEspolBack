import { ServiceStatus } from '../entities/service-status.entity';
import { ServiceStatusType } from '../enums';

export interface IServiceStatusRepository {
  getLatest(): Promise<ServiceStatus[]>;
  create(data: {
    scope?: string;
    targetId?: string | null;
    status: ServiceStatusType;
    title: string;
    description?: string | null;
    reason?: string | null;
  }): Promise<ServiceStatus>;
}

export const SERVICE_STATUS_REPOSITORY_TOKEN = Symbol('IServiceStatusRepository');
