import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdminGuard } from '../auth/admin.guard';
@Controller('ads')
export class AdsController {
  constructor(private svc: AdsService) {}
  @Get()          async getAll() { return { ok:true, data: await this.svc.findAll() }; }
  @Get('admin')   @UseGuards(AdminGuard) async getAllAdmin() { return { ok:true, data: await this.svc.findAllAdmin() }; }
  @Post()         @UseGuards(AdminGuard) async create(@Body() b:any) { return { ok:true, data: await this.svc.create(b) }; }
  @Put(':id')     @UseGuards(AdminGuard) async update(@Param('id') id:string, @Body() b:any) { return { ok:true, data: await this.svc.update(id,b) }; }
  @Delete(':id')  @UseGuards(AdminGuard) async delete(@Param('id') id:string) { await this.svc.delete(id); return { ok:true }; }
}
