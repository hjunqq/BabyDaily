import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FamilyMember,
  FamilyRole,
  MemberStatus,
  ROLE_HIERARCHY,
} from '../../modules/family/entities/family-member.entity';
import { Baby } from '../../modules/baby/entities/baby.entity';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';
import { ErrorCodes } from '../enums/error-codes.enum';

/**
 * RoleGuard checks that the current user has sufficient role in the family
 * that owns the target baby. It resolves the family from babyId (params/body)
 * or familyId (params/body), then checks the user's role meets the minimum.
 *
 * Also enforces MemberStatus.ACTIVE — pending members are rejected.
 *
 * Attaches `request.familyMember` for downstream use.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(FamilyMember)
    private memberRepo: Repository<FamilyMember>,
    @InjectRepository(Baby)
    private babyRepo: Repository<Baby>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<FamilyRole>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @RequireRole decorator, skip this guard
    if (!requiredRole) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) {
      throw new ForbiddenException({
        message: 'Authentication required',
        code: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    // Resolve familyId from babyId or direct familyId
    const familyId = await this.resolveFamilyId(request);
    if (!familyId) {
      throw new ForbiddenException({
        message: 'Cannot determine family context',
        code: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    // Find user's membership in this family
    const member = await this.memberRepo.findOne({
      where: { family_id: familyId, user_id: userId },
    });

    if (!member) {
      throw new ForbiddenException({
        message: 'You are not a member of this family',
        code: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    if (member.status === MemberStatus.PENDING) {
      throw new ForbiddenException({
        message: 'Your membership is pending approval',
        code: ErrorCodes.MEMBERSHIP_PENDING,
      });
    }

    if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[requiredRole]) {
      throw new ForbiddenException({
        message: `Requires ${requiredRole} role or above`,
        code: ErrorCodes.ROLE_INSUFFICIENT,
      });
    }

    // Attach for downstream use
    request.familyMember = member;
    return true;
  }

  private async resolveFamilyId(request: any): Promise<string | null> {
    // Try direct familyId
    const familyId =
      request.params?.familyId ||
      request.body?.familyId ||
      request.body?.family_id;
    if (familyId) return familyId;

    // Try via babyId
    const babyId =
      request.params?.babyId ||
      request.body?.babyId ||
      request.body?.baby_id;
    if (babyId) {
      const baby = await this.babyRepo.findOne({ where: { id: babyId } });
      return baby?.family_id || null;
    }

    return null;
  }
}
