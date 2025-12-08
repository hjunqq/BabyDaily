import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginWechatDto } from './dto/login-wechat.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login/wechat')
    async login(@Body() body: LoginWechatDto) {
        return this.authService.loginWithWechat(body.code);
    }

    @Post('login/dev')
    async loginDev() {
        return this.authService.loginDev();
    }
}
