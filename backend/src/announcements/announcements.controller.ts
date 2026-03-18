import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AdminGuard } from '../auth/admin.guard';
@Controller('ann')
export class AnnouncementsController {
  constructor(private svc: AnnouncementsService) {}
  @Get()      async getAll() { return { ok:true, data: await this.svc.findAll() }; }
  @Post()     @UseGuards(AdminGuard) async create(@Body() b:{content:string}) { return { ok:true, data: await this.svc.create(b.content) }; }
  @Delete(':id') @UseGuards(AdminGuard) async delete(@Param('id') id:string) { await this.svc.delete(Number(id)); return { ok:true }; }
}
