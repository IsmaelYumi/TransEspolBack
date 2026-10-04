import { Global, Module } from '@nestjs/common';
import { RedisService } from '../infrastructure/cache/redis.service';
import { RedisTrackingRepository } from '../infrastructure/cache/redis-tracking.repository';
import { TRACKING_CACHE_REPOSITORY_TOKEN } from '../domain/repositories/tracking-cache.repository.interface';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: TRACKING_CACHE_REPOSITORY_TOKEN,
      useClass: RedisTrackingRepository,
    },
  ],
  exports: [
    RedisService,
    TRACKING_CACHE_REPOSITORY_TOKEN,
  ],
})
export class CacheModule {}
