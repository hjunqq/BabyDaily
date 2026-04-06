import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { AuthService } from './auth.service';
import { BootstrapDto } from './dto/bootstrap.dto';
import { LoginWechatDto } from './dto/login-wechat.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/wechat')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() body: LoginWechatDto) {
    return this.authService.loginWithWechat(body.code);
  }

  @Post('login/dev')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async loginDev() {
    const isDev = process.env.NODE_ENV === 'development';
    const isDevLoginEnabled = process.env.ENABLE_DEV_LOGIN === 'true';

    if (!isDev && !isDevLoginEnabled) {
      throw new ForbiddenException({
        message: 'Dev login only available in development mode',
        code: ErrorCodes.AUTH_FORBIDDEN,
      });
    }
    return this.authService.loginDev();
  }

  @Post('bootstrap')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async bootstrap(@Body() body: BootstrapDto) {
    return this.authService.bootstrap(body);
  }

  @Get('session')
  @UseGuards(AuthGuard('jwt'))
  async getSession(@Request() req: any) {
    return this.authService.getSession(req.user.userId);
  }
}
