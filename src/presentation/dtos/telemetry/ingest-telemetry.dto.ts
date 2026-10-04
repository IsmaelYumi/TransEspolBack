import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class IngestTelemetryDto {
  @ApiProperty({ description: 'UUID del vehículo emisor de telemetría' })
  @IsUUID('4')
  @IsNotEmpty({ message: 'El vehicleId es obligatorio' })
  vehicleId: string;

  @ApiPropertyOptional({ description: 'UUID de la ruta asignada si aplica' })
  @IsOptional()
  @IsUUID('4')
  routeId?: string;

  @ApiPropertyOptional({ description: 'UUID del viaje (Trip) activo si aplica' })
  @IsOptional()
  @IsUUID('4')
  tripId?: string;

  @ApiProperty({ example: -2.1465 })
  @Type(() => Number)
  @IsLatitude({ message: 'Latitud inválida (-90 a 90)' })
  latitude: number;

  @ApiProperty({ example: -79.9664 })
  @Type(() => Number)
  @IsLongitude({ message: 'Longitud inválida (-180 a 180)' })
  longitude: number;

  @ApiPropertyOptional({ example: 28.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(160)
  speed?: number = 0;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number = 0;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracy?: number = 5;

  @ApiPropertyOptional({ example: 'AVL_GPS', default: 'AVL_GPS' })
  @IsOptional()
  @IsString()
  source?: string = 'AVL_GPS';

  @ApiPropertyOptional({ example: '2026-10-04T17:00:00Z' })
  @IsOptional()
  timestamp?: string;
}
