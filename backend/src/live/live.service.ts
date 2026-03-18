import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AppGateway } from '../gateway/app.gateway';

const LIVE_KEY = 'ppl:live';

@Injectable()
export class LiveService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private gateway: AppGateway,
  ) {}

  async get(): Promise<any> {
    const cached = await this.redis.get(LIVE_KEY);
    if (cached) return JSON.parse(cached);
    const row = await this.prisma.liveState.findUnique({ where: { id: 1 } });
    return row?.data ?? null;
  }

  async set(data: any): Promise<void> {
    await this.prisma.liveState.upsert({
      where: { id: 1 },
      create: { id: 1, data },
      update: { data },
    });
    await this.redis.set(LIVE_KEY, JSON.stringify(data), 3600);
    await this.gateway.broadcastLive(data);
  }

  async clear(): Promise<void> {
    await this.prisma.liveState.upsert({
      where: { id: 1 },
      create: { id: 1, data: null },
      update: { data: null },
    });
    await this.redis.del(LIVE_KEY);
    await this.gateway.broadcastLive(null);
  }

  async addBall(matchId: string, d: any): Promise<void> {
    const ev = await this.prisma.ballEvent.create({
      data: {
        matchId, innings: d.innings||1, over: d.over||0, ball: d.ball||0,
        runs: d.runs||0, isWicket: d.isWicket||false, isWide: d.isWide||false,
        isNoBall: d.isNoBall||false, isBye: d.isBye||false,
        batsman: d.batsman||'', bowler: d.bowler||'', commentary: d.commentary||'',
      },
    });
    await this.gateway.broadcastBall({ matchId, ...ev });
  }
}
