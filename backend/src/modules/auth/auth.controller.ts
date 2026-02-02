import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginWechatDto } from './dto/login-wechat.dto';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login/wechat')
    async login(@Body() body: LoginWechatDto) {
        return this.authService.loginWithWechat(body.code);
    }

    @Post('login/dev')
    async loginDev() {
        if (process.env.NODE_ENV !== 'development') {
            throw new ForbiddenException({
                message: 'Dev login only available in development mode',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }
        return this.authService.loginDev();
    }
}
