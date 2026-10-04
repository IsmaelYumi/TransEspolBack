import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MicrosoftLoginDto {
  @ApiProperty({
    description: 'Microsoft OAuth2 / OpenID Connect ID Token or Bearer Access Token obtained from ESPOL Microsoft Login',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsNotEmpty({ message: 'El token de Microsoft es obligatorio' })
  @IsString({ message: 'El token de Microsoft debe ser una cadena de texto' })
  token: string;
}
