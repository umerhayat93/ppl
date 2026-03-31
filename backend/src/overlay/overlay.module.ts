import { Module } from '@nestjs/common';
import { OverlayController } from './overlay.controller';
import { OverlayService } from './overlay.service';
import { GatewayModule } from '../gateway/gateway.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [GatewayModule, RedisModule, AuthModule],
  controllers: [OverlayController],
  providers: [OverlayService],
})
export class OverlayModule {}
