import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findAll() { return this.prisma.ad.findMany({ where:{ active:true }, orderBy:{ sortOrder:'asc' } }); }
  async findAllAdmin() { return this.prisma.ad.findMany({ orderBy: { sortOrder:'asc' } }); }
  async create(d: any) {
    const a = await this.prisma.ad.create({ data: { content:d.content, active:d.active!==false, sortOrder:d.sortOrder||0 } });
    await this.gw.broadcast(WS.ADS, await this.findAll()); return a;
  }
  async update(id: string, d: any) {
    const a = await this.prisma.ad.update({ where:{id}, data:{ content:d.content, active:d.active, sortOrder:d.sortOrder } });
    await this.gw.broadcast(WS.ADS, await this.findAll()); return a;
  }
  async delete(id: string) {
    await this.prisma.ad.delete({ where:{id} });
    await this.gw.broadcast(WS.ADS, await this.findAll());
  }
}
