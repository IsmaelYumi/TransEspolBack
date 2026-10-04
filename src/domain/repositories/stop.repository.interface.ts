import { Stop } from '../entities/stop.entity';

export interface IStopRepository {
  findById(id: string): Promise<Stop | null>;
  findByCode(code: string): Promise<Stop | null>;
  findAll(): Promise<Stop[]>;
  findActive(): Promise<Stop[]>;
  findNearby(latitude: number, longitude: number, radiusKm?: number): Promise<Stop[]>;
}

export const STOP_REPOSITORY_TOKEN = Symbol('IStopRepository');
