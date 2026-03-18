import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private available = false;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — Redis disabled, using DB fallback');
      return;
    }
    try {
      const opts: any = {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        connectTimeout: 5000,
        retryStrategy: () => null,
      };
      this.client     = new Redis(url, opts);
      this.subscriber = new Redis(url, opts);
      this.publisher  = new Redis(url, opts);

      const onError = (e: Error) => {
        if (this.available) this.logger.warn('Redis unavailable: ' + e.message);
        this.available = false;
      };

      this.client.on('ready', () => { this.available = true; this.logger.log('Redis connected ✓'); });
      this.client.on('error', onError);
      this.subscriber.on('error', onError);
      this.publisher.on('error', onError);

      Promise.all([
        this.client.connect().catch(() => {}),
        this.subscriber.connect().catch(() => {}),
        this.publisher.connect().catch(() => {}),
      ]).catch(() => {});
    } catch (e) {
      this.logger.warn('Redis init failed — running without cache');
      this.client = null; this.subscriber = null; this.publisher = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.available || !this.client) return null;
    try { return await this.client.get(key); } catch { return null; }
  }
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.available || !this.client) return;
    try { ttl ? await this.client.set(key, value, 'EX', ttl) : await this.client.set(key, value); } catch {}
  }
  async del(key: string): Promise<void> {
    if (!this.available || !this.client) return;
    try { await this.client.del(key); } catch {}
  }
  async publish(channel: string, msg: string): Promise<void> {
    if (!this.available || !this.publisher) return;
    try { await this.publisher.publish(channel, msg); } catch {}
  }
  async subscribe(channel: string, cb: (msg: string) => void): Promise<void> {
    if (!this.available || !this.subscriber) return;
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, msg) => { if (ch === channel) cb(msg); });
    } catch {}
  }
  async onModuleDestroy() {
    await Promise.allSettled([this.client?.quit(), this.subscriber?.quit(), this.publisher?.quit()]);
  }
}
