import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
@Module({ imports:[AuthModule,GatewayModule], controllers:[GalleryController], providers:[GalleryService] })
export class GalleryModule {}
