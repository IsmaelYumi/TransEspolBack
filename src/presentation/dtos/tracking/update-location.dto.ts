import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'UUID del bus emisor de telemetría',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'El busId debe ser un UUID válido (versión 4)' })
  @IsNotEmpty({ message: 'El busId es requerido' })
  busId: string;

  @ApiPropertyOptional({
    description: 'UUID de la ruta asignada al bus en tránsito',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El routeId debe ser un UUID válido' })
  routeId?: string;

  @ApiProperty({
    description: 'Latitud geográfica WGS84 del vehículo (-90 a 90)',
    example: -2.1465,
  })
  @Type(() => Number)
  @IsLatitude({ message: 'La latitud debe ser una coordenada válida entre -90 y 90' })
  latitude: number;

  @ApiProperty({
    description: 'Longitud geográfica WGS84 del vehículo (-180 a 180)',
    example: -79.9664,
  })
  @Type(() => Number)
  @IsLongitude({ message: 'La longitud debe ser una coordenada válida entre -180 y 180' })
  longitude: number;

  @ApiPropertyOptional({
    description: 'Velocidad en km/h registrada por el GPS',
    example: 32.5,
    minimum: 0,
    maximum: 160,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La velocidad debe ser un valor numérico' })
  @Min(0, { message: 'La velocidad no puede ser negativa' })
  @Max(160, { message: 'La velocidad máxima permitida para buses ESPOL es 160 km/h' })
  speed?: number = 0;

  @ApiPropertyOptional({
    description: 'Rumbo / orientación en grados (0 a 360)',
    example: 180,
    minimum: 0,
    maximum: 360,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El rumbo (heading) debe ser un valor numérico' })
  @Min(0, { message: 'El rumbo no puede ser menor a 0 grados' })
  @Max(360, { message: 'El rumbo no puede superar los 360 grados' })
  heading?: number = 0;

  @ApiPropertyOptional({
    description: 'Precisión del sensor GPS en metros',
    example: 4.2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La precisión debe ser numérica' })
  @Min(0, { message: 'La precisión no puede ser negativa' })
  accuracy?: number = 5;
}
