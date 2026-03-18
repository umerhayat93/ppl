import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService, private gw: AppGateway, private redis: RedisService) {}

  async findAll() {
    return this.prisma.team.findMany({
      include: { group: true, squad: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }
  async create(d: any) {
    const t = await this.prisma.team.create({
      data: { name: d.name, emoji: d.emoji||'🏏', captain: d.captain||'', groupId: d.groupId||null },
      include: { group: true, squad: true },
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.TEAMS, await this.findAll());
    return t;
  }
  async update(id: string, d: any) {
    const t = await this.prisma.team.update({
      where: { id },
      data: { name:d.name, emoji:d.emoji, captain:d.captain||'', groupId:d.groupId||null },
      include: { group: true, squad: true },
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.TEAMS, await this.findAll());
    return t;
  }
  async delete(id: string) {
    await this.prisma.team.delete({ where: { id } });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.TEAMS, await this.findAll());
  }
}
