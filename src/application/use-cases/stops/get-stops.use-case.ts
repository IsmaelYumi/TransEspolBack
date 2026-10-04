import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IStopRepository, STOP_REPOSITORY_TOKEN } from '../../../domain/repositories/stop.repository.interface';
import { Stop } from '../../../domain/entities/stop.entity';

@Injectable()
export class GetStopsUseCase {
  constructor(
    @Inject(STOP_REPOSITORY_TOKEN)
    private readonly stopRepository: IStopRepository,
  ) {}

  async getAll(): Promise<Stop[]> {
    return await this.stopRepository.findAll();
  }

  async getActive(): Promise<Stop[]> {
    return await this.stopRepository.findActive();
  }

  async getById(id: string): Promise<Stop> {
    const stop = await this.stopRepository.findById(id);
    if (!stop) {
      throw new NotFoundException(`Parada con ID ${id} no encontrada`);
    }
    return stop;
  }

  async findNearby(lat: number, lng: number, radiusKm = 1.0): Promise<Stop[]> {
    return await this.stopRepository.findNearby(lat, lng, radiusKm);
  }
}
