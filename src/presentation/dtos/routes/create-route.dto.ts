import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({
    description: 'Código único representativo de la ruta',
    example: 'R-PROSPERINA',
  })
  @IsNotEmpty({ message: 'El código de la ruta es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  code: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la ruta institucional',
    example: 'Ruta Perimetral - Campus Gustavo Galindo',
  })
  @IsNotEmpty({ message: 'El nombre de la ruta es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción de paradas principales u horarios de atención',
    example: 'Recorrido desde Entrada Prosperina hasta FIEC, FIMCP y CELEX',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Color distintivo de la ruta en hexadecimal',
    example: '#003366',
  })
  @IsOptional()
  @IsHexColor({ message: 'El color debe ser un código hexadecimal válido (ej: #003366)' })
  colorHex?: string = '#003366';

  @ApiPropertyOptional({
    description: 'Cadena de polilínea codificada o GeoJSON para visualización en mapa móvil',
  })
  @IsOptional()
  @IsString()
  polyline?: string;

  @ApiPropertyOptional({
    description: 'Horario programado de operación',
    example: '06:30 - 21:00',
  })
  @IsOptional()
  @IsString()
  schedule?: string;
}
