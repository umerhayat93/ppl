import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('matches')
export class MatchesController {
  constructor(private svc: MatchesService) {}
  @Get()    async getAll() { return { ok:true, data: await this.svc.findAll() }; }
  @Post()   @UseGuards(AdminGuard) async create(@Body() b:any) { return { ok:true, data: await this.svc.create(b) }; }
  @Put(':id') @UseGuards(AdminGuard) async update(@Param('id') id:string, @Body() b:any) { return { ok:true, data: await this.svc.update(id,b) }; }
  @Post(':id/finish') @UseGuards(AdminGuard) async finish(@Param('id') id:string, @Body() b:any) { return { ok:true, data: await this.svc.finish(id,b) }; }
  @Post(':id/status') @UseGuards(AdminGuard) async status(@Param('id') id:string, @Body() b:any) { return { ok:true, data: await this.svc.updateStatus(id,b) }; }
  @Post(':id/inn1')   @UseGuards(AdminGuard) async inn1(@Param('id') id:string, @Body() b:any)   { return { ok:true, data: await this.svc.saveInn1(id,b) }; }
  @Delete(':id') @UseGuards(AdminGuard) async delete(@Param('id') id:string) { await this.svc.delete(id); return { ok:true }; }
  @Get(':id/balls') async getBalls(@Param('id') id:string) { return { ok:true, data: await this.svc.getBalls(id) }; }
}
