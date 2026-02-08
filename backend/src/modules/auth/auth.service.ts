import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async loginWithWechat(code: string) {
    const appId = this.configService.get<string>('WECHAT_APPID');
    const appSecret = this.configService.get<string>('WECHAT_SECRET');

    if (!appId || !appSecret) {
      throw new Error('WeChat AppID or Secret not configured');
    }

    // Call WeChat API to get openid
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const { data } = await firstValueFrom(this.httpService.get(url));

      if (data.errcode) {
        throw new UnauthorizedException(`WeChat API Error: ${data.errmsg}`);
      }

      const { openid } = data;

      // Find or create user
      let user = await this.usersService.findOneByOpenid(openid);
      if (!user) {
        user = await this.usersService.create(openid);
      }

      // Generate JWT
      const payload = { sub: user.id, openid: user.openid };
      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to authenticate with WeChat');
    }
  }

  async loginDev() {
    // Mock user creation for dev
    const mockOpenId = 'dev-openid-001';
    let user = await this.usersService.findOneByOpenid(mockOpenId);
    if (!user) {
      user = await this.usersService.create(mockOpenId);
    }

    const payload = { sub: user.id, openid: user.openid };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
