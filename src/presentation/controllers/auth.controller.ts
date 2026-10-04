import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginWithMicrosoftUseCase } from '../../application/use-cases/auth/login-with-microsoft.use-case';
import { MicrosoftLoginDto } from '../dtos/auth/microsoft-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../guards/current-user.decorator';
import { JwtPayload } from '../../application/ports/token.service.interface';
import { Public } from '../guards/public.decorator';

@ApiTags('Autenticación Institucional ESPOL')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginWithMicrosoftUseCase: LoginWithMicrosoftUseCase) {}

  @Public()
  @Post('microsoft')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Stricter rate limit on auth endpoint
  @ApiOperation({
    summary: 'Iniciar sesión con cuenta Microsoft institucional de ESPOL',
    description:
      'Valida el token de Microsoft/Azure AD, verifica que el correo pertenezca al dominio @espol.edu.ec, aprovisiona la cuenta en PostgreSQL y emite tokens JWT.',
  })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa. Retorna tokens y perfil.' })
  @ApiResponse({ status: 401, description: 'Token de Microsoft inválido o correo no institucional.' })
  async loginWithMicrosoft(@Body() dto: MicrosoftLoginDto) {
    return await this.loginWithMicrosoftUseCase.execute(dto.token);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener datos del usuario actualmente autenticado',
    description: 'Retorna los datos del usuario extraídos de la sesión JWT.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autorizado o token expirado' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return {
      authenticated: true,
      user,
    };
  }
}
