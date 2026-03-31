import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { AppGateway } from '../gateway/app.gateway';

const KEY = 'ppl:overlay';

// Default state — all panels hidden
const DEFAULT = {
  squadComparison: false,
  scoreCard:        false,  // innings 1 or 2
  batterCard:       false,
  bowlerFigures:    false,
  hotPlayer:        false,
  topBatters:       false,
  topBowlers:       false,
  runsRequired:     false,
};

@Injectable()
export class OverlayService {
  constructor(
    private redis: RedisService,
    private gateway: AppGateway,
  ) {}

  async get(): Promise<any> {
    const cached = await this.redis.get(KEY);
    if (cached) return JSON.parse(cached);
    return DEFAULT;
  }

  async set(state: any): Promise<void> {
    const merged = { ...DEFAULT, ...state };
    await this.redis.set(KEY, JSON.stringify(merged), 86400);
    // Broadcast to overlay clients
    await this.gateway.broadcast('overlay', merged);
  }
}
