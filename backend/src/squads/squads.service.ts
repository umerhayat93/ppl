import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class SquadsService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findByTeam(teamId: string) {
    return this.prisma.squadMember.findMany({ where: { teamId }, orderBy: { createdAt: 'asc' } });
  }
  async add(teamId: string, d: any) {
    const m = await this.prisma.squadMember.create({ data: { teamId, name: d.name, role: d.role||'bat' } });
    await this.gw.broadcast(WS.TEAMS, null); return m;
  }
  async remove(id: string) {
    await this.prisma.squadMember.delete({ where: { id } });
    await this.gw.broadcast(WS.TEAMS, null);
  }
}
