import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  readonly subscriber: Redis;
  readonly publisher: Redis;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const opts: any = { maxRetriesPerRequest: 3, enableOfflineQueue: false, lazyConnect: false };
    this.client     = new Redis(url, opts);
    this.subscriber = new Redis(url, opts);
    this.publisher  = new Redis(url, opts);
    [this.client, this.subscriber, this.publisher].forEach(r =>
      r.on('error', e => this.logger.warn('Redis: ' + e.message))
    );
  }

  async get(key: string): Promise<string | null> {
    try { return await this.client.get(key); } catch { return null; }
  }
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      ttl ? await this.client.set(key, value, 'EX', ttl) : await this.client.set(key, value);
    } catch {}
  }
  async del(key: string): Promise<void> { try { await this.client.del(key); } catch {} }
  async publish(channel: string, msg: string): Promise<void> {
    try { await this.publisher.publish(channel, msg); } catch {}
  }
  async subscribe(channel: string, cb: (msg: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, msg) => { if (ch === channel) cb(msg); });
    } catch {}
  }
  async onModuleDestroy() {
    await Promise.allSettled([this.client.quit(), this.subscriber.quit(), this.publisher.quit()]);
  }
}
