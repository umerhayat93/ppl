import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
@Module({ imports:[AuthModule,GatewayModule], controllers:[TeamsController], providers:[TeamsService], exports:[TeamsService] })
export class TeamsModule {}
