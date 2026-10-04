import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatusType } from '../../../domain/enums';

export class CreateServiceStatusDto {
  @ApiPropertyOptional({ example: 'ROUTE', default: 'SYSTEM' })
  @IsOptional()
  @IsString()
  scope?: string = 'SYSTEM';

  @ApiPropertyOptional({ description: 'UUID del objetivo (ruta, parada) si aplica' })
  @IsOptional()
  @IsUUID('4')
  targetId?: string;

  @ApiProperty({ enum: ServiceStatusType, example: ServiceStatusType.NORMAL })
  @IsEnum(ServiceStatusType)
  @IsNotEmpty()
  status: ServiceStatusType;

  @ApiProperty({ example: 'Servicio operando con normalidad' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Frecuencias cada 15 minutos en todas las paradas.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Operación regular en horario diurno.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
