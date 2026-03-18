import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers['authorization'] || '';
    if (!header.startsWith('Bearer ')) throw new UnauthorizedException('Admin access required');
    const payload = this.auth.verify(header.slice(7));
    if (payload?.role !== 'admin') throw new UnauthorizedException('Admin access required');
    req.admin = payload;
    return true;
  }
}
