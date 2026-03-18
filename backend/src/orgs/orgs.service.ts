import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findAll() { return this.prisma.org.findMany({ orderBy:{ createdAt:'asc' } }); }
  async create(d: any) {
    const o = await this.prisma.org.create({ data:{ name:d.name, role:d.role||'', emoji:d.emoji||'🏢', since:d.since||'' } });
    await this.gw.broadcast(WS.ORGS, await this.findAll()); return o;
  }
  async update(id: string, d: any) {
    const o = await this.prisma.org.update({ where:{id}, data:{ name:d.name, role:d.role, emoji:d.emoji, since:d.since } });
    await this.gw.broadcast(WS.ORGS, await this.findAll()); return o;
  }
  async delete(id: string) { await this.prisma.org.delete({ where:{id} }); await this.gw.broadcast(WS.ORGS, await this.findAll()); }
}
