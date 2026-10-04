import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusStatus } from '../../../domain/enums';

export class UpdateBusStatusDto {
  @ApiProperty({
    description: 'Nuevo estado operacional del bus',
    enum: BusStatus,
    example: BusStatus.ON_ROUTE,
  })
  @IsNotEmpty({ message: 'El estado del bus es obligatorio' })
  @IsEnum(BusStatus, {
    message: 'El estado del bus debe ser uno de: IDLE, ON_ROUTE, MAINTENANCE, OFFLINE',
  })
  status: BusStatus;
}
