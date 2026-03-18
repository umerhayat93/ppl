import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private gw: AppGateway,
    private redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.group.findMany({
      include: { teams: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(d: any) {
    if (!d.name?.trim()) throw new BadRequestException('Name required');
    try {
      const g = await this.prisma.group.create({
        data: { name: d.name.trim(), color: d.color || 'gold' },
      });
      await this.redis.del('ppl:bootstrap');
      await this.gw.broadcast(WS.GROUPS, await this.findAll());
      return g;
    } catch (e: any) {
      throw new BadRequestException('Failed to create group: ' + e.message);
    }
  }

  async update(id: string, d: any) {
    if (!d.name?.trim()) throw new BadRequestException('Name required');
    const g = await this.prisma.group.update({
      where: { id },
      data: { name: d.name.trim(), color: d.color || 'gold' },
    });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.GROUPS, await this.findAll());
    return g;
  }

  async delete(id: string) {
    await this.prisma.group.delete({ where: { id } });
    await this.redis.del('ppl:bootstrap');
    await this.gw.broadcast(WS.GROUPS, await this.findAll());
  }
}
