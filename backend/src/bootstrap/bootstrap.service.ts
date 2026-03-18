import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CACHE_KEY = 'ppl:bootstrap';
const CACHE_TTL = 30; // 30 seconds

@Injectable()
export class BootstrapService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async getAll() {
    // Try Redis cache first
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const [groups, teams, matches, players, polls, orgs, rules, ann, gallery, ads, liveRow] =
      await Promise.all([
        this.prisma.group.findMany({ include: { teams: true }, orderBy: { name: 'asc' } }),
        this.prisma.team.findMany({
          include: { group: true, squad: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.match.findMany({
          include: {
            team1: { include: { group: true } },
            team2: { include: { group: true } },
            group: true,
            sentiments: true,
          },
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
        }),
        this.prisma.player.findMany({
          include: { team: true },
          orderBy: [{ runs: 'desc' }, { wickets: 'desc' }],
        }),
        this.prisma.poll.findMany({ orderBy: { createdAt: 'desc' } }),
        this.prisma.org.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.rule.findMany({ orderBy: { id: 'asc' } }),
        this.prisma.announcement.findMany({ orderBy: { id: 'desc' }, take: 30 }),
        this.prisma.gallery.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.ad.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        this.prisma.liveState.findUnique({ where: { id: 1 } }),
      ]);

    const result = {
      groups,
      teams,
      matches,
      players,
      polls,
      orgs,
      rules,
      ann,
      gallery,
      ads,
      live: liveRow?.data ?? null,
    };

    // Cache for 30 seconds
    await this.redis.set(CACHE_KEY, JSON.stringify(result), CACHE_TTL);
    return result;
  }

  async invalidate() {
    await this.redis.del(CACHE_KEY);
  }
}
