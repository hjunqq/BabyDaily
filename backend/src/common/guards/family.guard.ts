import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { FamilyService } from '../../modules/family/family.service';
import { ErrorCodes } from '../enums/error-codes.enum';

@Injectable()
export class FamilyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private familyService: FamilyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const babyId =
      request.params?.babyId || request.body?.babyId || request.body?.baby_id;

    if (!babyId || !user?.userId) {
      throw new ForbiddenException({
        message: 'Missing babyId or user info',
        code: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    if (!isUUID(String(babyId), '4')) {
      throw new BadRequestException({
        message: 'Invalid babyId format',
        code: ErrorCodes.VALIDATION_FAILED,
      });
    }

    const belongs = await this.familyService.isActiveMemberOfBabyFamily(
      babyId,
      user.userId,
    );
    if (!belongs) {
      throw new ForbiddenException({
        message: 'No permission for this baby data',
        code: ErrorCodes.AUTH_FORBIDDEN,
      });
    }
    return true;
  }
}
