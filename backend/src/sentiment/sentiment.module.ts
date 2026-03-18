import { Module } from '@nestjs/common';
import { SentimentController } from './sentiment.controller';
import { SentimentService } from './sentiment.service';
import { GatewayModule } from '../gateway/gateway.module';
@Module({ imports:[GatewayModule], controllers:[SentimentController], providers:[SentimentService] })
export class SentimentModule {}
