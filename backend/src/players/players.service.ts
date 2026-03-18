import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService, private gw: AppGateway, private redis: RedisService) {}

  async findAll() {
    return this.prisma.player.findMany({
      include: { team: true },
      orderBy: [{ runs: 'desc' }, { wickets: 'desc' }],
    });
  }
  async create(d: any) {
    const p = await this.prisma.player.create({
      data: {
        name: d.name, emoji: d.emoji||'🏏', teamId: d.teamId||null,
        role: d.role||'batting', runs: d.runs||0, wickets: d.wickets||0,
        strikeRate: d.strikeRate||0, economy: d.economy||0, best: d.best||'',
      },
      include: { team: true },
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.PLAYERS, await this.findAll());
    return p;
  }
  async update(id: string, d: any) {
    const p = await this.prisma.player.update({
      where: { id },
      data: {
        ...(d.name       !== undefined && { name:       d.name }),
        ...(d.emoji      !== undefined && { emoji:      d.emoji }),
        ...(d.teamId     !== undefined && { teamId:     d.teamId }),
        ...(d.role       !== undefined && { role:       d.role }),
        ...(d.runs       !== undefined && { runs:       Number(d.runs) }),
        ...(d.wickets    !== undefined && { wickets:    Number(d.wickets) }),
        ...(d.strikeRate !== undefined && { strikeRate: Number(d.strikeRate) }),
        ...(d.economy    !== undefined && { economy:    Number(d.economy) }),
        ...(d.best       !== undefined && { best:       d.best }),
      },
      include: { team: true },
    });
    await this.gw.broadcast(WS.PLAYERS, await this.findAll());
    return p;
  }
  async delete(id: string) {
    await this.prisma.player.delete({ where: { id } });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.PLAYERS, await this.findAll());
  }
}
