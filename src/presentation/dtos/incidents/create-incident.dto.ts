import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity, IncidentType } from '../../../domain/enums';

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentType, example: IncidentType.BLOCKED_STOP })
  @IsEnum(IncidentType)
  @IsNotEmpty({ message: 'El tipo de incidencia es obligatorio' })
  type: IncidentType;

  @ApiPropertyOptional({ enum: IncidentSeverity, example: IncidentSeverity.MEDIUM })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity = IncidentSeverity.MEDIUM;

  @ApiProperty({ example: 'Vehículo particular bloquea la bahía de la Parada FIEC.' })
  @IsString()
  @IsNotEmpty({ message: 'La descripción del incidente es obligatoria' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  routeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  stopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;
}
