import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import {
  IMicrosoftAuthService,
  MICROSOFT_AUTH_SERVICE_TOKEN,
} from '../../ports/microsoft-auth.service.interface';
import {
  ITokenService,
  TOKEN_SERVICE_TOKEN,
  AuthTokens,
} from '../../ports/token.service.interface';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    institutionalId?: string | null;
  };
  tokens: AuthTokens;
}

@Injectable()
export class LoginWithMicrosoftUseCase {
  private readonly logger = new Logger(LoginWithMicrosoftUseCase.name);

  constructor(
    @Inject(MICROSOFT_AUTH_SERVICE_TOKEN)
    private readonly microsoftAuthService: IMicrosoftAuthService,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(TOKEN_SERVICE_TOKEN)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(microsoftToken: string): Promise<LoginResult> {
    // 1. Validate Microsoft Token and extract profile
    const profile = await this.microsoftAuthService.validateToken(microsoftToken);

    // 2. Find or Provision User in PostgreSQL
    let user = await this.userRepository.findByEmail(profile.email);

    if (!user) {
      this.logger.log(`Provisioning new institutional ESPOL user: ${profile.email}`);
      // Determine initial role: Check if it's an admin or driver email pattern, else default to STUDENT
      let role = UserRole.STUDENT;
      if (profile.email.includes('admin.transporte') || profile.email.includes('admin')) {
        role = UserRole.ADMIN;
      } else if (profile.email.includes('conductor') || profile.email.includes('driver')) {
        role = UserRole.DRIVER;
      }

      user = await this.userRepository.create({
        email: profile.email,
        name: profile.name,
        role,
        institutionalId: profile.institutionalId ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        isActive: true,
      });
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('Su cuenta institucional se encuentra inactiva. Contacte a soporte de ESPOL.');
      }
      // Update name/avatar if changed
      if (user.name !== profile.name) {
        user = await this.userRepository.update(user.id, { name: profile.name });
      }
    }

    // 3. Issue JWT Access & Refresh Tokens
    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionalId: user.institutionalId,
      },
      tokens,
    };
  }
}
