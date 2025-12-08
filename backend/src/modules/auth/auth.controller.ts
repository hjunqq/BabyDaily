import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login/wechat')
    async login(@Body('code') code: string) {
        return this.authService.loginWithWechat(code);
    }

    @Post('login/dev')
    async loginDev() {
        return this.authService.loginDev();
    }
}
