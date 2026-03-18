import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidKey() { return this.svc.getVapidPublicKey(); }

  @Post('subscribe')
  subscribe(@Body() b: { endpoint: string; p256dh: string; auth: string }) {
    return this.svc.subscribe(b.endpoint, b.p256dh, b.auth);
  }

  @Post('unsubscribe')
  unsubscribe(@Body() b: { endpoint: string }) {
    return this.svc.unsubscribe(b.endpoint);
  }

  @Post('send')
  @UseGuards(AdminGuard)
  send(@Body() b: { title: string; body: string; icon?: string; url?: string }) {
    return this.svc.sendToAll(b.title, b.body, b.icon, b.url);
  }

  // Legacy /api/notify endpoint (keep parity with old Flask app)
  @Post()
  @UseGuards(AdminGuard)
  notify(@Body() b: { title: string; body: string; icon?: string }) {
    return this.svc.sendToAll(b.title, b.body, b.icon);
  }
}
