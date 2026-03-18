import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';
@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService, private gw: AppGateway, private redis: RedisService) {}
  async findAll() { return this.prisma.group.findMany({ include: { teams: true }, orderBy: { name: 'asc' } }); }
  async create(d: any) {
    const g = await this.prisma.group.create({ data: { name: d.name, color: d.color||'gold' } });
    await this.redis.del('ppl:bootstrap'); await this.gw.broadcast(WS.GROUPS, await this.findAll()); return g;
  }
  async update(id: string, d: any) {
    const g = await this.prisma.group.update({ where: { id }, data: { name:d.name, color:d.color } });
    await this.redis.del('ppl:bootstrap'); await this.gw.broadcast(WS.GROUPS, await this.findAll()); return g;
  }
  async delete(id: string) {
    await this.prisma.group.delete({ where: { id } });
    await this.redis.del('ppl:bootstrap'); await this.gw.broadcast(WS.GROUPS, await this.findAll());
  }
}
