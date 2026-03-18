import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  login(user: string, pass: string) {
    const u = this.config.get('ADMIN_USER') || 'ppl2026';
    const p = this.config.get('ADMIN_PASS') || 'ppl@2620';
    if (user !== u || pass !== p) throw new UnauthorizedException('Invalid credentials');
    return { token: this.jwt.sign({ sub: 'admin', role: 'admin' }) };
  }

  verify(token: string): any {
    try { return this.jwt.verify(token); }
    catch { throw new UnauthorizedException('Invalid token'); }
  }
}
