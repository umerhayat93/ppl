import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('groups')
export class GroupsController {
  constructor(private svc: GroupsService) {}

  @Get()
  async getAll() {
    return { ok: true, data: await this.svc.findAll() };
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() b: any) {
    return { ok: true, data: await this.svc.create(b) };
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id') id: string, @Body() b: any) {
    return { ok: true, data: await this.svc.update(id, b) };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    await this.svc.delete(id);
    return { ok: true };
  }
}
