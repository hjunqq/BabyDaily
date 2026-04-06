import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import { FamilyService } from '../family/family.service';
import { BabyService } from '../baby/baby.service';
import { User } from '../users/entities/user.entity';
import { BootstrapDto } from './dto/bootstrap.dto';

type SessionContext = {
  family: { id: string; name: string } | null;
  baby: any | null;
  onboardingRequired: boolean;
  membershipPending?: boolean;
  role?: string;
};

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

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const { data } = await firstValueFrom(this.httpService.get(url));

      if (data.errcode) {
        throw new UnauthorizedException(`WeChat API Error: ${data.errmsg}`);
      }

      const { openid } = data;

      let user = await this.usersService.findOneByOpenid(openid);
      if (!user) {
        user = await this.usersService.create(openid);
      }

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

  async loginWithPin(pin: string) {
    const expectedPin =
      this.configService.get<string>('WEB_ACCESS_PIN') ||
      this.configService.get<string>('ACCESS_PIN') ||
      this.configService.get<string>('VITE_ACCESS_PIN');

    if (!expectedPin) {
      throw new ForbiddenException('Web PIN login is not configured');
    }

    if (!pin || pin !== expectedPin) {
      throw new UnauthorizedException('Invalid access PIN');
    }

    return this.loginDev();
  }

  async bootstrap(dto: BootstrapDto) {
    let authResult: { access_token: string; user: User };
    if (dto.method === 'wechat') {
      authResult = await this.loginWithWechat(dto.code!);
    } else if (dto.method === 'pin') {
      authResult = await this.loginWithPin(dto.pin!);
    } else {
      const isDev = process.env.NODE_ENV === 'development';
      const isDevLoginEnabled = process.env.ENABLE_DEV_LOGIN === 'true';
      if (!isDev && !isDevLoginEnabled) {
        throw new ForbiddenException(
          'Dev login only available in development mode',
        );
      }
      authResult = await this.loginDev();
    }

    const { access_token, user } = authResult;

    return {
      access_token,
      user,
      ...(await this.buildSessionContext(user)),
    };
  }

  async getSession(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user,
      ...(await this.buildSessionContext(user)),
    };
  }

  private async buildSessionContext(user: User): Promise<SessionContext> {
    // Check for pending memberships first
    const pendingMember = await this.familyService.findPendingMembership(
      user.id,
    );
    if (pendingMember) {
      return {
        family: pendingMember.family
          ? { id: pendingMember.family.id, name: pendingMember.family.name }
          : null,
        baby: null,
        onboardingRequired: true,
        membershipPending: true,
      };
    }

    // Active families
    const families = await this.familyService.findMyFamilies(user.id);
    if (families.length === 0) {
      return {
        family: null,
        baby: null,
        onboardingRequired: true,
      };
    }

    for (const family of families) {
      const babies = await this.babyService.findByFamily(family.id);
      const member = await this.familyService.getUserRoleInFamily(
        family.id,
        user.id,
      );
      if (babies.length > 0) {
        return {
          family: { id: family.id, name: family.name },
          baby: babies[0],
          onboardingRequired: false,
          role: member?.role,
        };
      }
    }

    const member = await this.familyService.getUserRoleInFamily(
      families[0].id,
      user.id,
    );
    return {
      family: { id: families[0].id, name: families[0].name },
      baby: null,
      onboardingRequired: true,
      role: member?.role,
    };
  }
}
