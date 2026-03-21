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
    const email      = this.config.get<string>('VAPID_EMAIL') || 'mailto:malakumer8@gmail.com';
    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(email, publicKey, privateKey);
        this.vapidConfigured = true;
        this.logger.log('VAPID push notifications configured ✓');
      } catch (e: any) {
        this.logger.warn('VAPID config failed: ' + e.message);
      }
    } else {
      this.logger.warn('VAPID keys not set — push disabled.');
    }
  }

  getVapidPublicKey() {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') || '' };
  }

  async subscribe(endpoint: string, p256dh: string, auth: string) {
    try {
      return await this.prisma.pushSubscription.upsert({
        where:  { endpoint },
        create: { endpoint, p256dh, auth },
        update: { p256dh, auth },
      });
    } catch (e: any) {
      this.logger.warn('Subscribe error: ' + e.message);
      return null;
    }
  }

  async unsubscribe(endpoint: string) {
    try { await this.prisma.pushSubscription.delete({ where: { endpoint } }); } catch {}
  }

  async sendToAll(title: string, body: string, icon = '🏏', url = '/') {
    // In-app broadcast via WebSocket
    await this.gw.broadcastNotification(title, body, icon);

    if (!this.vapidConfigured) {
      this.logger.warn('Web push skipped — VAPID not configured');
      return { sent: 0, total: 0, wsOnly: true };
    }

    const subs = await this.prisma.pushSubscription.findMany();
    if (!subs.length) return { sent: 0, total: 0 };

    let sent = 0;
    const dead: string[] = [];

    // Clean modern notification payload
    // — No icon (removes the small app icon shown circled in screenshot)
    // — No url shown in notification body
    // — Title is the big bold text, body is the message
    const payload = JSON.stringify({
      title,                          // shown large/bold by Android
      body,                           // shown as message text
      // icon intentionally omitted  → removes the small icon shown in notification
      badge: '/icons/badge-72.png',   // small status bar icon (monochrome)
      tag: 'ppl2026',                 // replaces previous notification of same tag
      renotify: true,
      silent: false,
      vibrate: [200, 100, 200],
      data: { url },                  // used by SW click handler, NOT shown to user
    });

    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { urgency: 'high', TTL: 3600 },
          );
          sent++;
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            dead.push(s.endpoint);
          } else {
            this.logger.warn(`Push failed: ${e.message}`);
          }
        }
      }),
    );

    if (dead.length) {
      await Promise.allSettled(dead.map(ep => this.unsubscribe(ep)));
    }

    this.logger.log(`Push sent: ${sent}/${subs.length}`);
    return { sent, total: subs.length };
  }
}
