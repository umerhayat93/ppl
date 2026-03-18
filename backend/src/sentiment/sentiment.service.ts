import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SentimentService {
  constructor(private prisma: PrismaService, private gw: AppGateway, private redis: RedisService) {}

  async getForMatch(matchId: string) {
    const rows = await this.prisma.sentiment.findMany({ where: { matchId }, include: { team: true } });
    const counts: Record<string,number> = {};
    for (const r of rows) {
      counts[r.teamId] = (counts[r.teamId] || 0) + 1;
    }
    const total = rows.length;
    const teams = await this.prisma.match.findUnique({
      where: { id: matchId }, include: { team1: true, team2: true },
    });
    return {
      total,
      team1: { id: teams?.team1Id, name: teams?.team1.name, votes: counts[teams?.team1Id||'']||0 },
      team2: { id: teams?.team2Id, name: teams?.team2.name, votes: counts[teams?.team2Id||'']||0 },
    };
  }

  async vote(matchId: string, teamId: string, sessionId: string) {
    // Check if already voted
    const existing = await this.prisma.sentiment.findUnique({
      where: { matchId_sessionId: { matchId, sessionId } },
    });
    if (existing) {
      if (existing.teamId === teamId) {
        // Toggle off (remove vote)
        await this.prisma.sentiment.delete({ where: { id: existing.id } });
      } else {
        // Switch team
        await this.prisma.sentiment.update({ where: { id: existing.id }, data: { teamId } });
      }
    } else {
      await this.prisma.sentiment.create({ data: { matchId, teamId, sessionId } });
    }
    const result = await this.getForMatch(matchId);
    await this.gw.broadcastSentiment(matchId, result);
    return result;
  }
}
