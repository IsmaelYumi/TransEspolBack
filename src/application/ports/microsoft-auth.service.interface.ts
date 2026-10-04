export interface MicrosoftUserProfile {
  azureId: string;
  email: string;
  name: string;
  institutionalId?: string;
  avatarUrl?: string;
}

export interface IMicrosoftAuthService {
  validateToken(idToken: string): Promise<MicrosoftUserProfile>;
}

export const MICROSOFT_AUTH_SERVICE_TOKEN = Symbol('IMicrosoftAuthService');
