import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../presentation/controllers/auth.controller';
import { LoginWithMicrosoftUseCase } from '../application/use-cases/auth/login-with-microsoft.use-case';
import { MicrosoftAuthService } from '../infrastructure/auth/microsoft-auth.service';
import { JwtTokenService } from '../infrastructure/auth/jwt-token.service';
import { JwtStrategy } from '../infrastructure/auth/jwt.strategy';
import { WsJwtGuard } from '../infrastructure/auth/ws-jwt.guard';
import { MICROSOFT_AUTH_SERVICE_TOKEN } from '../application/ports/microsoft-auth.service.interface';
import { TOKEN_SERVICE_TOKEN } from '../application/ports/token.service.interface';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginWithMicrosoftUseCase,
    JwtStrategy,
    WsJwtGuard,
    JwtTokenService,
    {
      provide: MICROSOFT_AUTH_SERVICE_TOKEN,
      useClass: MicrosoftAuthService,
    },
    {
      provide: TOKEN_SERVICE_TOKEN,
      useExisting: JwtTokenService,
    },
  ],
  exports: [
    TOKEN_SERVICE_TOKEN,
    MICROSOFT_AUTH_SERVICE_TOKEN,
    JwtTokenService,
    WsJwtGuard,
    JwtModule,
  ],
})
export class AuthModule {}
