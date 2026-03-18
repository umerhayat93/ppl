import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
@Module({ imports:[AuthModule,GatewayModule], controllers:[MatchesController], providers:[MatchesService], exports:[MatchesService] })
export class MatchesModule {}
