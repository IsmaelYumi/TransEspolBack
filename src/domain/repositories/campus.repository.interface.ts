import { Campus, Building, PointOfInterest } from '../entities/campus.entity';

export interface ICampusRepository {
  getCampuses(): Promise<Campus[]>;
  getBuildings(campusId?: string): Promise<Building[]>;
  getPois(buildingId?: string): Promise<PointOfInterest[]>;
  findPoiById(id: string): Promise<PointOfInterest | null>;
}

export const CAMPUS_REPOSITORY_TOKEN = Symbol('ICampusRepository');
