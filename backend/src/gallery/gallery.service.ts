import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findAll() { return this.prisma.gallery.findMany({ orderBy:{ createdAt:'asc' } }); }
  async create(d: any) {
    const g = await this.prisma.gallery.create({ data:{ emoji:d.emoji||'🖼️', label:d.label||'', category:d.category||'match' } });
    await this.gw.broadcast(WS.GALLERY, await this.findAll()); return g;
  }
  async delete(id: string) { await this.prisma.gallery.delete({ where:{id} }); await this.gw.broadcast(WS.GALLERY, await this.findAll()); }
}
