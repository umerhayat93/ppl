import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SentimentService } from './sentiment.service';
@Controller('sentiment')
export class SentimentController {
  constructor(private svc: SentimentService) {}
  @Get(':matchId')  async get(@Param('matchId') id:string) { return { ok:true, data: await this.svc.getForMatch(id) }; }
  @Post(':matchId') async vote(@Param('matchId') id:string, @Body() b: { teamId:string; sessionId:string }) {
    return { ok:true, data: await this.svc.vote(id, b.teamId, b.sessionId) };
  }
}
