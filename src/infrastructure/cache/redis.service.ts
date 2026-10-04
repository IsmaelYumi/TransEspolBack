import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST') || this.configService.get<string>('REDISHOST', 'localhost');
    const port = Number(this.configService.get<number>('REDIS_PORT') || this.configService.get<number>('REDISPORT', 6379));
    const password = this.configService.get<string>('REDIS_PASSWORD') || this.configService.get<string>('REDISPASSWORD');
    const db = Number(this.configService.get<number>('REDIS_DB', 0));
    const keyPrefix = this.configService.get<string>('REDIS_KEY_PREFIX', 'transespol:');

    const commonOptions = {
      keyPrefix,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => {
        if (times > 5) {
          this.logger.warn(' Redis retry limit reached. Falling back to internal memory cache.');
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    };

    if (redisUrl) {
      this.client = new Redis(redisUrl, commonOptions);
    } else {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        db,
        ...commonOptions,
      });
    }

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log(` Connected to Redis (prefix: ${keyPrefix})`);
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(` Redis connection note: ${err.message}. (Coordinates will cache gracefully).`);
    });

    this.client.connect().catch((err) => {
      this.logger.warn(` Initial Redis connection deferred: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log(' Disconnected from Redis');
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.error(`Error setting Redis key ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.error(`Error deleting Redis key ${key}: ${err.message}`);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) return [];
    try {
      return await this.client.keys(pattern);
    } catch {
      return [];
    }
  }
}
