import { UserRole } from '../enums';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly institutionalId?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  public isDriver(): boolean {
    return this.role === UserRole.OPERATOR;
  }

  public isOperator(): boolean {
    return this.role === UserRole.OPERATOR;
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isStudent(): boolean {
    return this.role === UserRole.PASSENGER;
  }

  public isPassenger(): boolean {
    return this.role === UserRole.PASSENGER;
  }

  public static isInstitutionalEmail(email: string, allowedDomain = 'espol.edu.ec'): boolean {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower.endsWith(`@${allowedDomain}`) || lower.endsWith(`.${allowedDomain}`);
  }
}
