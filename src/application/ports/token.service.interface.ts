import { UserRole } from '../../domain/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ITokenService {
  generateTokens(payload: JwtPayload): Promise<AuthTokens>;
  verifyToken(token: string): Promise<JwtPayload>;
}

export const TOKEN_SERVICE_TOKEN = Symbol('ITokenService');
