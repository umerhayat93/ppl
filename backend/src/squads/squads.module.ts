import { Module } from '@nestjs/common';
import { SquadsController } from './squads.controller';
import { SquadsService } from './squads.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
@Module({ imports:[AuthModule,GatewayModule], controllers:[SquadsController], providers:[SquadsService] })
export class SquadsModule {}
