import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PollsService } from './polls.service';
import { AdminGuard } from '../auth/admin.guard';
@Controller('polls')
export class PollsController {
  constructor(private svc: PollsService) {}
  @Get()    async getAll() { return { ok:true, data: await this.svc.findAll() }; }
  @Post()   @UseGuards(AdminGuard) async create(@Body() b:any) { return { ok:true, data: await this.svc.create(b) }; }
  @Post(':id/vote') async vote(@Param('id') id:string, @Body() b:{idx:number;voter:string}) {
    await this.svc.vote(id, b.idx, b.voter); return { ok:true };
  }
  @Delete(':id') @UseGuards(AdminGuard) async delete(@Param('id') id:string) { await this.svc.delete(id); return { ok:true }; }
}
