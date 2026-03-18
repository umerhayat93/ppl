import { Controller, Get } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';

@Controller('bootstrap')
export class BootstrapController {
  constructor(private svc: BootstrapService) {}

  @Get()
  async bootstrap() {
    return { ok: true, data: await this.svc.getAll() };
  }
}
