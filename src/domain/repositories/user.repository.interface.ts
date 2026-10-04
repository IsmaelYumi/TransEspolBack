import { User } from '../entities/user.entity';
import { UserRole } from '../enums';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByInstitutionalId(institutionalId: string): Promise<User | null>;
  create(user: { email: string; name: string; role: UserRole; institutionalId?: string | null; avatarUrl?: string | null; isActive?: boolean }): Promise<User>;
  update(id: string, partial: Partial<User>): Promise<User>;
  updateRole(id: string, role: UserRole): Promise<User>;
}

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
