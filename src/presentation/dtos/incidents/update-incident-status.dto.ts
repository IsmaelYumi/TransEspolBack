import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentStatus } from '../../../domain/enums';

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus, example: IncidentStatus.RESOLVED })
  @IsEnum(IncidentStatus)
  @IsNotEmpty({ message: 'El estado del incidente es requerido' })
  status: IncidentStatus;
}
