import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findAll() { return this.prisma.rule.findMany({ orderBy:{ id:'asc' } }); }
  async create(content: string) {
    const r = await this.prisma.rule.create({ data:{ content } });
    await this.gw.broadcast(WS.RULES, await this.findAll()); return r;
  }
  async delete(id: number) { await this.prisma.rule.delete({ where:{id} }); await this.gw.broadcast(WS.RULES, await this.findAll()); }
}
