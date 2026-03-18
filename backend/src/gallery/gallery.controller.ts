import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { AdminGuard } from '../auth/admin.guard';
@Controller('gallery')
export class GalleryController {
  constructor(private svc: GalleryService) {}
  @Get()     async getAll() { return { ok:true, data: await this.svc.findAll() }; }
  @Post()    @UseGuards(AdminGuard) async create(@Body() b:any) { return { ok:true, data: await this.svc.create(b) }; }
  @Delete(':id') @UseGuards(AdminGuard) async delete(@Param('id') id:string) { await this.svc.delete(id); return { ok:true }; }
}
