import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    previousValue?: any;
    newValue?: any;
    ipAddress?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          previousValue: params.previousValue ? JSON.parse(JSON.stringify(params.previousValue)) : undefined,
          newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (err: any) {
      this.logger.error(`Error saving audit log: ${err.message}`);
    }
  }

  async getRecentLogs(limit = 50) {
    return await this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
