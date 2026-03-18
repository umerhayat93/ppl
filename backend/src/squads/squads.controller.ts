import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SquadsService } from './squads.service';
import { AdminGuard } from '../auth/admin.guard';
@Controller('squads')
export class SquadsController {
  constructor(private svc: SquadsService) {}
  @Get(':teamId')    async get(@Param('teamId') tid:string) { return { ok:true, data: await this.svc.findByTeam(tid) }; }
  @Post(':teamId')   @UseGuards(AdminGuard) async add(@Param('teamId') tid:string, @Body() b:any) { return { ok:true, data: await this.svc.add(tid,b) }; }
  @Delete(':id')     @UseGuards(AdminGuard) async remove(@Param('id') id:string) { await this.svc.remove(id); return { ok:true }; }
}
