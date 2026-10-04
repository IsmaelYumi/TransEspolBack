import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ITokenService,
  JwtPayload,
  AuthTokens,
} from '../../application/ports/token.service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessSecret = this.configService.get<string>('JWT_SECRET')!;
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1d');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.name,
        },
        {
          secret: accessSecret,
          expiresIn: accessExpiresIn as any,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
        },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn as any,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET')!;
      return await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
