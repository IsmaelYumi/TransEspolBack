import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertType } from '../../../domain/enums';

export class CreateAlertDto {
  @ApiProperty({ enum: AlertType, example: AlertType.DELAY })
  @IsEnum(AlertType, { message: 'Tipo de alerta inválido' })
  @IsNotEmpty({ message: 'El tipo de alerta es requerido' })
  type: AlertType;

  @ApiPropertyOptional({ enum: AlertPriority, example: AlertPriority.MEDIUM })
  @IsOptional()
  @IsEnum(AlertPriority)
  priority?: AlertPriority = AlertPriority.MEDIUM;

  @ApiProperty({ example: 'Retraso temporal en Ruta Entrada Normal' })
  @IsString()
  @IsNotEmpty({ message: 'El título de la alerta es obligatorio' })
  title: string;

  @ApiProperty({ example: 'Congestión vehicular a la altura de Rectorado. Retraso estimado de 5 minutos.' })
  @IsString()
  @IsNotEmpty({ message: 'El mensaje de la alerta es obligatorio' })
  message: string;

  @ApiPropertyOptional({ description: 'UUID de la ruta afectada si aplica' })
  @IsOptional()
  @IsUUID('4')
  routeId?: string;

  @ApiPropertyOptional({ description: 'UUID de la parada afectada si aplica' })
  @IsOptional()
  @IsUUID('4')
  stopId?: string;
}
