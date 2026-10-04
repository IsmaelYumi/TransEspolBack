import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeRouteDto {
  @ApiProperty({
    description: 'UUID de la ruta a la cual suscribir el socket para recibir telemetría en tiempo real',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  @IsUUID('4', { message: 'El routeId debe ser un UUID válido (v4)' })
  @IsNotEmpty({ message: 'El routeId es requerido' })
  routeId: string;
}
