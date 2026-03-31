import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { OverlayService } from './overlay.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('overlay')
export class OverlayController {
  constructor(private svc: OverlayService) {}

  @Get()
  async get() {
    return { ok: true, data: await this.svc.get() };
  }

  @Post()
  @UseGuards(AdminGuard)
  async set(@Body() b: any) {
    await this.svc.set(b);
    return { ok: true };
  }
}
