import {
  WebSocketGateway, WebSocketServer,
  OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export const WS = {
  LIVE:'live', MATCHES:'matches', TEAMS:'teams', PLAYERS:'players',
  GROUPS:'groups', SENTIMENT:'sentiment', ADS:'ads', POLLS:'polls',
  ORGS:'orgs', GALLERY:'gallery', RULES:'rules', ANN:'ann',
  NOTIFICATION:'notification', BALL:'ball',
};

@Injectable()
@WebSocketGateway({ cors: { origin: '*', credentials: true }, transports: ['websocket','polling'] })
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(AppGateway.name);
  private connections = 0;

  constructor(private redis: RedisService) {}

  async onModuleInit() {
    await this.redis.subscribe('ppl:broadcast', (msg) => {
      try { const { event, data } = JSON.parse(msg); this.server?.emit(event, data); }
      catch {}
    });
  }
  afterInit() { this.logger.log('WebSocket Gateway ready'); }
  handleConnection(c: Socket) { this.connections++; }
  handleDisconnect(c: Socket) { this.connections--; }

  async broadcast(event: string, data: any) {
    this.server?.emit(event, data);
    await this.redis.publish('ppl:broadcast', JSON.stringify({ event, data }));
  }
  async broadcastLive(data: any) { await this.broadcast(WS.LIVE, data); }
  async broadcastBall(data: any) { await this.broadcast(WS.BALL, data); }
  async broadcastSentiment(matchId: string, data: any) {
    await this.broadcast(WS.SENTIMENT, { matchId, ...data });
  }
  async broadcastNotification(title: string, body: string, icon = '🏏') {
    await this.broadcast(WS.NOTIFICATION, { title, body, icon });
  }
}
