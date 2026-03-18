import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';
import { LiveModule } from './live/live.module';
import { MatchesModule } from './matches/matches.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { GroupsModule } from './groups/groups.module';
import { SquadsModule } from './squads/squads.module';
import { SentimentModule } from './sentiment/sentiment.module';
import { AdsModule } from './ads/ads.module';
import { PollsModule } from './polls/polls.module';
import { OrgsModule } from './orgs/orgs.module';
import { GalleryModule } from './gallery/gallery.module';
import { RulesModule } from './rules/rules.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule, RedisModule, GatewayModule,
    AuthModule, LiveModule, MatchesModule, TeamsModule,
    PlayersModule, GroupsModule, SquadsModule, SentimentModule,
    AdsModule, PollsModule, OrgsModule, GalleryModule,
    RulesModule, AnnouncementsModule, NotificationsModule, BootstrapModule,
  ],
})
export class AppModule {}
