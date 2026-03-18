import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findAll() { return this.prisma.announcement.findMany({ orderBy:{ id:'desc' }, take:30 }); }
  async create(content: string) {
    const a = await this.prisma.announcement.create({ data:{ content } });
    await this.gw.broadcast(WS.ANN, await this.findAll()); return a;
  }
  async delete(id: number) { await this.prisma.announcement.delete({ where:{id} }); await this.gw.broadcast(WS.ANN, await this.findAll()); }
}
