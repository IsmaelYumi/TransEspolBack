import { Inject, Injectable } from '@nestjs/common';
import { ICampusRepository, CAMPUS_REPOSITORY_TOKEN } from '../../../domain/repositories/campus.repository.interface';

@Injectable()
export class GetCampusUseCase {
  constructor(
    @Inject(CAMPUS_REPOSITORY_TOKEN)
    private readonly campusRepository: ICampusRepository,
  ) {}

  async getCampuses() {
    return await this.campusRepository.getCampuses();
  }

  async getBuildings(campusId?: string) {
    return await this.campusRepository.getBuildings(campusId);
  }

  async getPois(buildingId?: string) {
    return await this.campusRepository.getPois(buildingId);
  }
}
