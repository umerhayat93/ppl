import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService, private gw: AppGateway, private redis: RedisService) {}

  private include = {
    team1: { include: { group: true } },
    team2: { include: { group: true } },
    group: true,
    sentiments: true,
  };

  async findAll() {
    return this.prisma.match.findMany({
      include: this.include,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async create(d: any) {
    const m = await this.prisma.match.create({
      data: {
        stage: d.stage||'group', groupId: d.groupId||null, matchNo: d.matchNo||'',
        team1Id: d.team1Id, team2Id: d.team2Id, date: d.date||'', time: d.time||'',
        year: d.year||2026, venue: d.venue||'Pattan Cricket Ground',
        status: d.status||'upcoming', overs: d.overs||10,
      },
      include: this.include,
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.MATCHES, await this.findAll());
    return m;
  }

  async update(id: string, d: any) {
    await this.prisma.match.findFirstOrThrow({ where: { id } });
    const m = await this.prisma.match.update({
      where: { id },
      data: {
        ...(d.stage      !== undefined && { stage:      d.stage }),
        ...(d.groupId    !== undefined && { groupId:    d.groupId }),
        ...(d.matchNo    !== undefined && { matchNo:    d.matchNo }),
        ...(d.team1Id    !== undefined && { team1Id:    d.team1Id }),
        ...(d.team2Id    !== undefined && { team2Id:    d.team2Id }),
        ...(d.date       !== undefined && { date:       d.date }),
        ...(d.time       !== undefined && { time:       d.time }),
        ...(d.venue      !== undefined && { venue:      d.venue }),
        ...(d.status     !== undefined && { status:     d.status }),
        ...(d.result     !== undefined && { result:     d.result }),
        ...(d.score1     !== undefined && { score1:     d.score1 }),
        ...(d.score2     !== undefined && { score2:     d.score2 }),
        ...(d.highlights !== undefined && { highlights: d.highlights }),
        ...(d.innings1   !== undefined && { innings1:   d.innings1 }),
        ...(d.overs      !== undefined && { overs:      d.overs }),
      },
      include: this.include,
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.MATCHES, await this.findAll());
    return m;
  }

  async finish(id: string, d: any) {
    const m = await this.prisma.match.update({
      where: { id },
      data: {
        status: 'completed', result: d.result||'',
        score1: d.score1||'', score2: d.score2||'',
        highlights: d.highlights||{},
        ...(d.innings1 !== undefined && { innings1: d.innings1 }),
      },
      include: this.include,
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.MATCHES, await this.findAll());
    return m;
  }

  async updateStatus(id: string, d: any) {
    const m = await this.prisma.match.update({
      where: { id },
      data: {
        ...(d.status !== undefined && { status: d.status }),
        ...(d.result !== undefined && { result: d.result }),
        ...(d.score1 !== undefined && { score1: d.score1 }),
        ...(d.score2 !== undefined && { score2: d.score2 }),
      },
      include: this.include,
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.MATCHES, await this.findAll());
    return m;
  }

  async saveInn1(id: string, d: any) {
    const m = await this.prisma.match.update({
      where: { id },
      data: { innings1: d.inn1||{}, score1: d.s1||'' },
      include: this.include,
    });
    await this.gw.broadcast(WS.MATCHES, await this.findAll());
    return m;
  }

  async delete(id: string) {
    await this.prisma.match.delete({ where: { id } });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.MATCHES, await this.findAll());
  }

  async getBalls(matchId: string) {
    return this.prisma.ballEvent.findMany({
      where: { matchId },
      orderBy: [{ innings: 'asc' }, { over: 'asc' }, { ball: 'asc' }],
    });
  }
}
