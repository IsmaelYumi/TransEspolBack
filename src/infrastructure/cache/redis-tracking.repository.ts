import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITrackingCacheRepository } from '../../domain/repositories/tracking-cache.repository.interface';
import { VehicleLocation } from '../../domain/entities/vehicle-location.entity';
import { RedisService } from './redis.service';

@Injectable()
export class RedisTrackingRepository implements ITrackingCacheRepository {
  private readonly logger = new Logger(RedisTrackingRepository.name);
  private readonly ttlSeconds: number;
  // In-memory fallback if Redis is down
  private readonly memoryCache = new Map<string, { location: VehicleLocation; expiresAt: number }>();
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = this.configService.get<number>('REDIS_COORDINATES_TTL_SECONDS', 120);
  }

  private getBusKey(busId: string): string {
    return `tracking:bus:${busId}`;
  }

  private getGeoKey(): string {
    return `tracking:geo`;
  }

  private parseLocation(jsonString: string): VehicleLocation | null {
    try {
      const data = JSON.parse(jsonString);
      return new VehicleLocation(
        data.busId,
        data.routeId,
        Number(data.latitude),
        Number(data.longitude),
        Number(data.speed || 0),
        Number(data.heading || 0),
        Number(data.accuracy || 5),
        new Date(data.timestamp),
        data.driverId,
      );
    } catch {
      return null;
    }
  }

  async saveLocation(location: VehicleLocation): Promise<void> {
    const rawJson = JSON.stringify(location.toJSON());
    const busKey = this.getBusKey(location.busId);

    // Save in memory fallback
    this.memoryCache.set(location.busId, {
      location,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });

    if (this.redisService.getIsConnected()) {
      const client = this.redisService.getClient();
      if (client) {
        try {
          const pipeline = client.pipeline();
          // Store serialized vehicle location with TTL
          pipeline.set(busKey, rawJson, 'EX', this.ttlSeconds);
          // Add to Redis Geospatial index: longitude, latitude, member
          pipeline.geoadd(this.getGeoKey(), location.longitude, location.latitude, location.busId);
          await pipeline.exec();
          return;
        } catch (err: any) {
          this.logger.error(`Error saving location in Redis pipeline: ${err.message}`);
        }
      }
    }
  }

  async getLocation(busId: string): Promise<VehicleLocation | null> {
    if (this.redisService.getIsConnected()) {
      const busKey = this.getBusKey(busId);
      const data = await this.redisService.get(busKey);
      if (data) {
        return this.parseLocation(data);
      }
    }

    // Check memory fallback
    const entry = this.memoryCache.get(busId);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.location;
    }
    this.memoryCache.delete(busId);
    return null;
  }

  async getAllLocations(): Promise<VehicleLocation[]> {
    if (this.redisService.getIsConnected()) {
      const client = this.redisService.getClient();
      if (client) {
        try {
          const keys = await client.keys('*tracking:bus:*');
          if (keys.length > 0) {
            // Remove prefix if client applies it
            const rawKeys = keys.map((k) => k.replace(client.options.keyPrefix || '', ''));
            const values = await client.mget(rawKeys);
            return values
              .filter((v): v is string => Boolean(v))
              .map((v) => this.parseLocation(v))
              .filter((l): l is VehicleLocation => l !== null && !l.isStale(this.ttlSeconds));
          }
        } catch (err: any) {
          this.logger.error(`Error fetching all locations from Redis: ${err.message}`);
        }
      }
    }
    // Fallback
    const now = Date.now();
    const result: VehicleLocation[] = [];
    for (const [id, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt > now && !entry.location.isStale(this.ttlSeconds)) {
        result.push(entry.location);
      } else {
        this.memoryCache.delete(id);
      }
    }
    return result;
  }
  async getLocationsByRoute(routeId: string): Promise<VehicleLocation[]> {
    const all = await this.getAllLocations();
    return all.filter((loc) => loc.routeId === routeId);
  }
  async removeLocation(busId: string): Promise<void> {
    this.memoryCache.delete(busId);
    if (this.redisService.getIsConnected()) {
      await this.redisService.del(this.getBusKey(busId));
      const client = this.redisService.getClient();
      if (client) {
        try {
          await client.zrem(this.getGeoKey(), busId);
        } catch {}
      }
    }
  }

  async findNearbyBuses(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<VehicleLocation[]> {
    if (this.redisService.getIsConnected()) {
      const client = this.redisService.getClient();
      if (client) {
        try {
          // GEORADIUS or GEOSEARCH
          const nearbyBusIds = (await client.georadius(
            this.getGeoKey(),
            longitude,
            latitude,
            radiusKm,
            'km',
          )) as string[];

          if (nearbyBusIds && nearbyBusIds.length > 0) {
            const locations: VehicleLocation[] = [];
            for (const busId of nearbyBusIds) {
              const loc = await this.getLocation(busId);
              if (loc) locations.push(loc);
            }
            return locations;
          }
        } catch (err: any) {
          this.logger.error(`Error in GEORADIUS query: ${err.message}`);
        }
      }
    }

    // Haversine fallback
    const all = await this.getAllLocations();
    return all.filter((loc) => {
      const dist = this.haversineDistanceKm(latitude, longitude, loc.latitude, loc.longitude);
      return dist <= radiusKm;
    });
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
