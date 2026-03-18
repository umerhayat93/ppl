import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('login')
  @HttpCode(200)
  login(@Body() body: { user: string; pass: string }) {
    return this.auth.login(body.user, body.pass);
  }
}
