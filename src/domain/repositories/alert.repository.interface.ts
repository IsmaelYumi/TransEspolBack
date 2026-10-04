import { Alert } from '../entities/alert.entity';
import { AlertPriority, AlertType } from '../enums';

export interface IAlertRepository {
  findActive(routeId?: string): Promise<Alert[]>;
  create(data: {
    type: AlertType;
    priority?: AlertPriority;
    title: string;
    message: string;
    routeId?: string | null;
    stopId?: string | null;
    startsAt?: Date;
    expiresAt?: Date | null;
    createdById?: string | null;
  }): Promise<Alert>;
  resolve(id: string): Promise<Alert>;
}

export const ALERT_REPOSITORY_TOKEN = Symbol('IAlertRepository');
