import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService, private gw: AppGateway, private redis: RedisService) {}

  private include = {
    team1: { include: { group: true, squad: true } },
    team2: { include: { group: true, squad: true } },
    group: true,
    sentiments: true,
  };

  async findAll() {
    return this.prisma.match.findMany({ include: this.include, orderBy: [{ date: 'asc' }, { time: 'asc' }] });
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

  // ─── FINISH MATCH — saves result + syncs player stats to DB ──────
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

    // Sync player stats — we know exactly which team batted which innings
    // battingFirst = team that batted in innings 1
    // bowlingFirst = team that bowled in innings 1 (batted in innings 2)
    if (d.battingFirst && d.bowlingFirst) {
      const batFirstTeam  = m.team1?.name === d.battingFirst ? m.team1  : m.team2;
      const bowlFirstTeam = m.team1?.name === d.bowlingFirst ? m.team1  : m.team2;

      // Inn1: batFirstTeam batted, bowlFirstTeam bowled
      const inn1Bat  = Object.values((d.innings1?.batters  || {})) as any[];
      const inn1Bowl = Object.values((d.innings1?.bowlers  || {})) as any[];
      // Inn2: bowlFirstTeam batted, batFirstTeam bowled
      const inn2Bat  = Object.values((d.innings2?.batters  || {})) as any[];
      const inn2Bowl = Object.values((d.innings2?.bowlers  || {})) as any[];

      await this.syncStats(inn1Bat,  batFirstTeam?.id  || null, 'bat');
      await this.syncStats(inn1Bowl, bowlFirstTeam?.id || null, 'bowl');
      await this.syncStats(inn2Bat,  bowlFirstTeam?.id || null, 'bat');
      await this.syncStats(inn2Bowl, batFirstTeam?.id  || null, 'bowl');
    }

    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.MATCHES, await this.findAll());

    // Broadcast updated players
    const players = await this.prisma.player.findMany({
      include: { team: true },
      orderBy: [{ runs: 'desc' }, { wickets: 'desc' }],
    });
    await this.gw.broadcast(WS.PLAYERS, players);

    return m;
  }

  // ─── Sync one innings stats into players table ────────────────────
  private async syncStats(records: any[], teamId: string|null, type: 'bat'|'bowl') {
    for (const r of records) {
      if (!r?.name) continue;

      // Find player by name (+ teamId if known)
      let player = await this.prisma.player.findFirst({
        where: teamId ? { name: r.name, teamId } : { name: r.name },
      });

      if (type === 'bat') {
        const runs  = r.runs  || 0;
        const balls = r.balls || 0;
        const sr    = balls > 0 ? Math.round((runs / balls) * 1000) / 10 : 0;
        const best  = `${runs}(${balls})`;

        if (player) {
          const prevBestRuns = parseInt((player.best||'0').split('(')[0]) || 0;
          await this.prisma.player.update({
            where: { id: player.id },
            data: {
              runs: player.runs + runs,
              strikeRate: sr,
              best: runs > prevBestRuns ? best : player.best,
              ...(teamId && !player.teamId && { teamId }),
            },
          });
        } else {
          await this.prisma.player.create({
            data: { name: r.name, emoji: '🏏', teamId, role: 'batting', runs, strikeRate: sr, best },
          });
        }
      } else {
        // bowl
        const wkts  = r.wickets      || 0;
        const balls = r.ballsBowled  || 0;
        const runs  = r.runsConceded || 0;
        const eco   = balls > 0 ? Math.round((runs / (balls / 6)) * 100) / 100 : 0;

        if (player) {
          const totalWkts = player.wickets + wkts;
          await this.prisma.player.update({
            where: { id: player.id },
            data: {
              wickets: totalWkts,
              economy: eco,
              role: player.role === 'batting' && wkts > 0 ? 'allround' : player.role,
              ...(teamId && !player.teamId && { teamId }),
            },
          });
        } else {
          await this.prisma.player.create({
            data: { name: r.name, emoji: '🏏', teamId, role: 'bowling', wickets: wkts, economy: eco },
          });
        }
      }
    }
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
