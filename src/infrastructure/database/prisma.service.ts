import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pgPool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pgPool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(' Connected to PostgreSQL database via Prisma 7 driver adapter');
    } catch (error: any) {
      this.logger.warn(
        ` PostgreSQL connection note: ${error.message}. Ensure docker compose is running (docker compose up -d).`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      await this.pgPool.end();
      this.logger.log(' Disconnected from PostgreSQL database');
    } catch (err: any) {
      this.logger.error('Error during PostgreSQL disconnect', err.message);
    }
  }
}
