import { Controller, Get, Put, Delete, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LiveService } from './live.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('live')
export class LiveController {
  constructor(private svc: LiveService) {}
  @Get()    async get() { return { ok:true, data: await this.svc.get() }; }
  @Put()    @UseGuards(AdminGuard) async set(@Body() b: any) { await this.svc.set(b); return { ok:true }; }
  @Delete() @UseGuards(AdminGuard) async clear() { await this.svc.clear(); return { ok:true }; }
  @Post('ball/:matchId') @UseGuards(AdminGuard)
  async ball(@Param('matchId') id: string, @Body() b: any) {
    await this.svc.addBall(id, b); return { ok:true };
  }
}
