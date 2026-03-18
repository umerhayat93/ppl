import { Module } from '@nestjs/common';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
@Module({ imports:[AuthModule,GatewayModule], controllers:[RulesController], providers:[RulesService] })
export class RulesModule {}
