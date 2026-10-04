import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignBusDto {
  @ApiPropertyOptional({
    description: 'UUID de la ruta asignada al bus (o null para desasignar)',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El routeId debe ser un UUID válido (v4)' })
  routeId?: string | null;

  @ApiPropertyOptional({
    description: 'UUID del usuario conductor asignado al bus (o null para desasignar)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El driverId debe ser un UUID válido (v4)' })
  driverId?: string | null;
}
