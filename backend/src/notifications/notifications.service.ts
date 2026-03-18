import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;

  constructor(
    private prisma: PrismaService,
    private gw: AppGateway,
    private config: ConfigService,
  ) {
    const publicKey  = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const email      = this.config.get<string>('VAPID_EMAIL') || 'mailto:admin@ppl2026.com';
    if (publicKey && privateKey) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('VAPID configured ✓');
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
    }
  }

  getVapidPublicKey() {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') || '' };
  }

  async subscribe(endpoint: string, p256dh: string, auth: string) {
    return this.prisma.pushSubscription.upsert({
      where:  { endpoint },
      create: { endpoint, p256dh, auth },
      update: { p256dh, auth },
    });
  }

  async unsubscribe(endpoint: string) {
    try { await this.prisma.pushSubscription.delete({ where: { endpoint } }); } catch {}
  }

  async sendToAll(title: string, body: string, icon = '🏏', url = '/') {
    // Broadcast via WebSocket (instant, no VAPID needed)
    await this.gw.broadcastNotification(title, body, icon);

    // Also send web push if VAPID configured
    if (!this.vapidConfigured) return { sent: 0, wsOnly: true };

    const subs = await this.prisma.pushSubscription.findMany();
    let sent = 0;
    const dead: string[] = [];

    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title, body, icon, url, badge: '/icons/badge-72.png' }),
          );
          sent++;
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) dead.push(s.endpoint);
          else this.logger.warn('Push failed: ' + e.message);
        }
      }),
    );

    // Remove dead subscriptions
    if (dead.length) {
      await Promise.allSettled(dead.map(ep => this.unsubscribe(ep)));
    }

    return { sent, total: subs.length };
  }
}
