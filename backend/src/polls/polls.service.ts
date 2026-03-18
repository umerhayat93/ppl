import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway, WS } from '../gateway/app.gateway';
@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService, private gw: AppGateway) {}
  async findAll() { return this.prisma.poll.findMany({ orderBy:{ createdAt:'desc' } }); }
  async create(d: any) {
    if (!d.question || !d.options || d.options.length < 2) throw new BadRequestException('Need question + 2 options');
    const p = await this.prisma.poll.create({
      data: { type:d.type||'Poll', question:d.question, options:d.options, votes:new Array(d.options.length).fill(0), votedBy:{} }
    });
    await this.gw.broadcast(WS.POLLS, await this.findAll()); return p;
  }
  async vote(id: string, idx: number, voter: string) {
    const p = await this.prisma.poll.findFirstOrThrow({ where:{id} });
    const votedBy = p.votedBy as any;
    if (votedBy[voter]) throw new BadRequestException('Already voted');
    const votes = p.votes as number[];
    if (idx < 0 || idx >= votes.length) throw new BadRequestException('Bad index');
    votes[idx]++;
    votedBy[voter] = true;
    await this.prisma.poll.update({ where:{id}, data:{ votes, votedBy } });
    await this.gw.broadcast(WS.POLLS, await this.findAll());
  }
  async delete(id: string) {
    await this.prisma.poll.delete({ where:{id} });
    await this.gw.broadcast(WS.POLLS, await this.findAll());
  }
}
