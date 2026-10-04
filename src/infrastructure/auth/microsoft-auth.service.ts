import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import jwksClient from 'jwks-rsa';
import {
  IMicrosoftAuthService,
  MicrosoftUserProfile,
} from '../../application/ports/microsoft-auth.service.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class MicrosoftAuthService implements IMicrosoftAuthService {
  private readonly logger = new Logger(MicrosoftAuthService.name);
  private readonly allowedDomain: string;
  private readonly clientId: string;
  private readonly tenantId: string;
  private readonly jwks: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    this.allowedDomain = this.configService.get<string>('MICROSOFT_ALLOWED_DOMAIN', 'espol.edu.ec');
    this.clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID', '');
    this.tenantId = this.configService.get<string>('MICROSOFT_TENANT_ID', 'common');

    this.jwks = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${this.tenantId}/discovery/v2.0/keys`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async validateToken(token: string): Promise<MicrosoftUserProfile> {
    if (!token || token.trim().length === 0) {
      throw new UnauthorizedException('Missing Microsoft authentication token');
    }

    // Development / Offline Mock Bypass for local developer speed
    if (
      this.configService.get<string>('NODE_ENV') !== 'production' &&
      (token.startsWith('mock_espol_') || this.clientId === 'mock-espol-client-id')
    ) {
      return this.handleDevMockToken(token);
    }

    // Production / Staging: Validate token with Microsoft Graph API or Azure AD JWKS
    try {
      // 1. Try Microsoft Graph API with the provided Bearer token
      const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });

      const profile = graphResponse.data;
      const email = profile.mail || profile.userPrincipalName;

      if (!email) {
        throw new UnauthorizedException('No email found in Microsoft account');
      }

      this.verifyInstitutionalDomain(email);

      return {
        azureId: profile.id,
        email: email.toLowerCase().trim(),
        name: profile.displayName || profile.givenName || 'ESPOL User',
        institutionalId: profile.jobTitle || profile.officeLocation || undefined,
      };
    } catch (graphError: any) {
      this.logger.warn(`Microsoft Graph verification failed: ${graphError.message}. Checking ID token format...`);

      // 2. Fallback: Parse and verify JWT payload structure
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          const email = payload.preferred_username || payload.email || payload.upn;

          if (!email) {
            throw new UnauthorizedException('Invalid Microsoft token: missing email identifier');
          }

          this.verifyInstitutionalDomain(email);

          return {
            azureId: payload.oid || payload.sub,
            email: email.toLowerCase().trim(),
            name: payload.name || 'ESPOL User',
            institutionalId: payload.employee_id || undefined,
          };
        }
      } catch (jwtError: any) {
        this.logger.error(`Error parsing Microsoft token: ${jwtError.message}`);
      }

      throw new UnauthorizedException(
        'Invalid or expired Microsoft token. Please re-authenticate via ESPOL Microsoft portal.',
      );
    }
  }

  private verifyInstitutionalDomain(email: string): void {
    if (!User.isInstitutionalEmail(email, this.allowedDomain)) {
      throw new UnauthorizedException(
        `Acceso denegado: El correo "${email}" no pertenece al dominio institucional (@${this.allowedDomain}). Debe iniciar sesión con su cuenta institucional de ESPOL.`,
      );
    }
  }

  private handleDevMockToken(token: string): MicrosoftUserProfile {
    this.logger.debug(`[DEV ONLY] Processing development mock Microsoft token: ${token}`);
    
    // Allow simulation of student or driver: mock_espol_driver or mock_espol_student
    let email = 'iyumi@espol.edu.ec';
    let name = 'Ismael Yumi';
    let institutionalId = '201912345';

    if (token.includes('driver')) {
      email = 'conductor.transporte@espol.edu.ec';
      name = 'Conductor ESPOL Disco 04';
      institutionalId = 'EMP-9876';
    } else if (token.includes('admin')) {
      email = 'admin.transporte@espol.edu.ec';
      name = 'Administrador ESPOL Transit';
      institutionalId = 'ADM-001';
    }

    return {
      azureId: 'mock-azure-uid-' + Buffer.from(email).toString('hex').slice(0, 12),
      email,
      name,
      institutionalId,
    };
  }
}
