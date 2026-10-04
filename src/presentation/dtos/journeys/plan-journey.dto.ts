import { IsLatitude, IsLongitude, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PlanJourneyDto {
  @ApiPropertyOptional({ description: 'Latitud de origen', example: -2.1445 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'La latitud de origen debe ser válida (-90 a 90)' })
  originLat?: number;

  @ApiPropertyOptional({ description: 'Longitud de origen', example: -79.9650 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'La longitud de origen debe ser válida (-180 a 180)' })
  originLng?: number;

  @ApiPropertyOptional({ description: 'UUID de un punto de interés o edificio de origen' })
  @IsOptional()
  @IsUUID('4', { message: 'El originPoiId debe ser un UUID válido' })
  originPoiId?: string;

  @ApiPropertyOptional({ description: 'Latitud de destino', example: -2.1465 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'La latitud de destino debe ser válida (-90 a 90)' })
  destLat?: number;

  @ApiPropertyOptional({ description: 'Longitud de destino', example: -79.9664 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'La longitud de destino debe ser válida (-180 a 180)' })
  destLng?: number;

  @ApiPropertyOptional({ description: 'UUID de un punto de interés o edificio de destino' })
  @IsOptional()
  @IsUUID('4', { message: 'El destPoiId debe ser un UUID válido' })
  destPoiId?: string;
}
