import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { FamilyService } from '../family/family.service';
import { BabyService } from '../baby/baby.service';
import { firstValueFrom } from 'rxjs';
import { BootstrapDto } from './dto/bootstrap.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private familyService: FamilyService,
    private babyService: BabyService,
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

  async bootstrap(dto: BootstrapDto) {
    // 1. Authenticate
    let authResult: { access_token: string; user: any };
    if (dto.method === 'wechat') {
      authResult = await this.loginWithWechat(dto.code!);
    } else {
      const isDev = process.env.NODE_ENV === 'development';
      const isDevLoginEnabled = process.env.ENABLE_DEV_LOGIN === 'true';
      if (!isDev && !isDevLoginEnabled) {
        throw new ForbiddenException('Dev login only available in development mode');
      }
      authResult = await this.loginDev();
    }

    const { access_token, user } = authResult;

    // 2. Ensure family exists
    let families = await this.familyService.findMyFamilies(user.id);
    let family;
    let createdFamily = false;
    if (families.length === 0) {
      family = await this.familyService.create(user.id, '宝宝的家');
      createdFamily = true;
    } else {
      family = families[0];
    }

    // 3. Ensure baby exists — search all families
    let baby = null;
    const allFamilies = createdFamily ? [family] : families;
    for (const f of allFamilies) {
      const babies = await this.babyService.findByFamily(f.id);
      if (babies.length > 0) {
        baby = babies[0];
        family = f;
        break;
      }
    }

    let createdBaby = false;
    if (!baby) {
      baby = await this.babyService.create({
        family_id: family.id,
        name: '宝宝',
        gender: 'FEMALE' as any,
        birthday: new Date(),
      });
      createdBaby = true;
    }

    return {
      access_token,
      user,
      family: { id: family.id, name: family.name },
      baby,
      created: { family: createdFamily, baby: createdBaby },
    };
  }
}
