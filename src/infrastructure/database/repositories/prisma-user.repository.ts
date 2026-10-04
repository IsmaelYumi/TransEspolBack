import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums';
import { User as PrismaUserModel } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaUserModel): User {
    return new User(
      raw.id,
      raw.email,
      raw.name,
      raw.role as UserRole,
      raw.institutionalId,
      raw.avatarUrl,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByInstitutionalId(institutionalId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { institutionalId } });
    return user ? this.toDomain(user) : null;
  }

  async create(
    data: { email: string; name: string; role: UserRole; institutionalId?: string | null; avatarUrl?: string | null; isActive?: boolean },
  ): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name,
        role: data.role,
        institutionalId: data.institutionalId ?? null,
        avatarUrl: data.avatarUrl ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, partial: Partial<User>): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(partial.name && { name: partial.name }),
        ...(partial.role && { role: partial.role }),
        ...(partial.avatarUrl !== undefined && { avatarUrl: partial.avatarUrl }),
        ...(partial.institutionalId !== undefined && { institutionalId: partial.institutionalId }),
        ...(partial.isActive !== undefined && { isActive: partial.isActive }),
      },
    });
    return this.toDomain(updated);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return this.toDomain(updated);
  }
}
