import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.liveState.upsert({ where:{id:1}, create:{id:1,data:null}, update:{} });
  }
  async onModuleDestroy() { await this.$disconnect(); }
}
