import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { Public } from '../guards/public.decorator';

@ApiTags('Monitoreo del Sistema')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Verificar estado de salud de la API, PostgreSQL (Prisma 7) y Redis',
  })
  @ApiResponse({ status: 200, description: 'Estado general del sistema' })
  async check() {
    let dbStatus = 'disconnected';
    let dbLatencyMs: number | null = null;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'healthy';
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    const redisConnected = this.redisService.getIsConnected();
    const redisStatus = redisConnected ? 'healthy' : 'fallback-in-memory';

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      service: 'TransEspol Backend API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: {
          engine: 'PostgreSQL',
          orm: 'Prisma 7 (pg adapter)',
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        cacheAndRealtime: {
          engine: 'Redis',
          status: redisStatus,
          features: ['Temporary Coordinates TTL (120s)', 'Geospatial Index (GEOADD)', 'Socket.IO Broadcasting'],
        },
      },
    };
  }
}
