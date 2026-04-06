import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Family } from './entities/family.entity';
import {
  FamilyMember,
  FamilyRole,
  MemberStatus,
  ROLE_HIERARCHY,
} from './entities/family-member.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { Baby } from '../baby/entities/baby.entity';
import { UsersService } from '../users/users.service';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(FamilyInvite)
    private inviteRepository: Repository<FamilyInvite>,
    @InjectRepository(Baby)
    private babyRepository: Repository<Baby>,
    private usersService: UsersService,
  ) {}

  // ─── Family CRUD ───────────────────────────────────────────

  async create(userId: string, name: string): Promise<Family> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const family = this.familyRepository.create({
      name,
      creator_id: user.id,
    });
    const savedFamily = await this.familyRepository.save(family);

    try {
      const member = this.familyMemberRepository.create({
        family_id: savedFamily.id,
        user_id: user.id,
        role: FamilyRole.OWNER,
        status: MemberStatus.ACTIVE,
        relation: 'creator',
      });
      await this.familyMemberRepository.save(member);
    } catch (error: any) {
      await this.familyRepository.remove(savedFamily);
      throw new BadRequestException(
        `Failed to add creator to family: ${error?.message}`,
      );
    }

    return savedFamily;
  }

  async findMyFamilies(userId: string): Promise<Family[]> {
    const members = await this.familyMemberRepository.find({
      where: { user_id: userId, status: MemberStatus.ACTIVE },
      relations: ['family'],
    });
    return members.map((member) => member.family);
  }

  async findOne(id: string): Promise<Family | null> {
    return this.familyRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
  }

  // ─── Membership checks ────────────────────────────────────

  /** Check if user is an ACTIVE member of the baby's family */
  async isActiveMemberOfBabyFamily(
    babyId: string,
    userId: string,
  ): Promise<boolean> {
    const baby = await this.babyRepository.findOne({ where: { id: babyId } });
    if (!baby) return false;
    const member = await this.familyMemberRepository.findOne({
      where: {
        family_id: baby.family_id,
        user_id: userId,
        status: MemberStatus.ACTIVE,
      },
    });
    return !!member;
  }

  /** Legacy compat — alias */
  async isBabyBelongToUserFamily(
    babyId: string,
    userId: string,
  ): Promise<boolean> {
    return this.isActiveMemberOfBabyFamily(babyId, userId);
  }

  async findPendingMembership(userId: string): Promise<FamilyMember | null> {
    return this.familyMemberRepository.findOne({
      where: { user_id: userId, status: MemberStatus.PENDING },
      relations: ['family'],
    });
  }

  async getUserRoleInFamily(
    familyId: string,
    userId: string,
  ): Promise<FamilyMember | null> {
    return this.familyMemberRepository.findOne({
      where: { family_id: familyId, user_id: userId, status: MemberStatus.ACTIVE },
    });
  }

  // ─── Invite codes ─────────────────────────────────────────

  async createInvite(
    familyId: string,
    userId: string,
    role: FamilyRole = FamilyRole.MEMBER,
  ): Promise<FamilyInvite> {
    // Verify caller is OWNER or GUARDIAN
    const caller = await this.familyMemberRepository.findOne({
      where: { family_id: familyId, user_id: userId, status: MemberStatus.ACTIVE },
    });
    if (!caller || ROLE_HIERARCHY[caller.role] < ROLE_HIERARCHY[FamilyRole.GUARDIAN]) {
      throw new ForbiddenException({
        message: 'Only OWNER or GUARDIAN can create invites',
        code: ErrorCodes.ROLE_INSUFFICIENT,
      });
    }

    // Cannot invite someone as OWNER
    if (role === FamilyRole.OWNER) {
      throw new BadRequestException({
        message: 'Cannot create invite with OWNER role',
        code: ErrorCodes.VALIDATION_FAILED,
      });
    }

    // GUARDIAN can only invite MEMBER or VIEWER
    if (
      caller.role === FamilyRole.GUARDIAN &&
      ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[FamilyRole.GUARDIAN]
    ) {
      throw new ForbiddenException({
        message: 'GUARDIAN can only invite MEMBER or VIEWER',
        code: ErrorCodes.ROLE_INSUFFICIENT,
      });
    }

    const code = this.generateInviteCode();
    const invite = this.inviteRepository.create({
      family_id: familyId,
      code,
      role,
      created_by: userId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    return this.inviteRepository.save(invite);
  }

  async joinByInvite(
    code: string,
    userId: string,
  ): Promise<{ member: FamilyMember; family: Family }> {
    const invite = await this.inviteRepository.findOne({
      where: { code },
      relations: ['family'],
    });

    if (!invite) {
      throw new BadRequestException({
        message: 'Invalid invite code',
        code: ErrorCodes.INVITE_INVALID,
      });
    }

    if (invite.used_by) {
      throw new BadRequestException({
        message: 'Invite code has already been used',
        code: ErrorCodes.INVITE_USED,
      });
    }

    if (new Date() > invite.expires_at) {
      throw new BadRequestException({
        message: 'Invite code has expired',
        code: ErrorCodes.INVITE_EXPIRED,
      });
    }

    // Check if already a member
    const existing = await this.familyMemberRepository.findOne({
      where: { family_id: invite.family_id, user_id: userId },
    });
    if (existing) {
      if (existing.status === MemberStatus.ACTIVE) {
        throw new BadRequestException({
          message: 'You are already a member of this family',
          code: ErrorCodes.VALIDATION_FAILED,
        });
      }
      if (existing.status === MemberStatus.PENDING) {
        throw new BadRequestException({
          message: 'Your join request is already pending approval',
          code: ErrorCodes.MEMBERSHIP_PENDING,
        });
      }
    }

    // Mark invite as used
    invite.used_by = userId;
    invite.used_at = new Date();
    await this.inviteRepository.save(invite);

    // Create PENDING membership
    const member = this.familyMemberRepository.create({
      family_id: invite.family_id,
      user_id: userId,
      role: invite.role,
      status: MemberStatus.PENDING,
    });
    const savedMember = await this.familyMemberRepository.save(member);

    return { member: savedMember, family: invite.family };
  }

  // ─── Approval ──────────────────────────────────────────────

  async getPendingMembers(
    familyId: string,
    userId: string,
  ): Promise<FamilyMember[]> {
    await this.requireRole(familyId, userId, FamilyRole.OWNER);
    return this.familyMemberRepository.find({
      where: { family_id: familyId, status: MemberStatus.PENDING },
      relations: ['user'],
    });
  }

  async approveMember(
    familyId: string,
    memberId: string,
    approverId: string,
  ): Promise<FamilyMember> {
    await this.requireRole(familyId, approverId, FamilyRole.OWNER);

    const member = await this.familyMemberRepository.findOne({
      where: { id: memberId, family_id: familyId, status: MemberStatus.PENDING },
    });
    if (!member) {
      throw new NotFoundException({
        message: 'Pending member not found',
        code: ErrorCodes.NOT_FOUND,
      });
    }

    member.status = MemberStatus.ACTIVE;
    return this.familyMemberRepository.save(member);
  }

  async rejectMember(
    familyId: string,
    memberId: string,
    approverId: string,
  ): Promise<void> {
    await this.requireRole(familyId, approverId, FamilyRole.OWNER);

    const member = await this.familyMemberRepository.findOne({
      where: { id: memberId, family_id: familyId, status: MemberStatus.PENDING },
    });
    if (!member) {
      throw new NotFoundException({
        message: 'Pending member not found',
        code: ErrorCodes.NOT_FOUND,
      });
    }

    await this.familyMemberRepository.remove(member);
  }

  // ─── Member management ────────────────────────────────────

  async getMembers(familyId: string, userId: string): Promise<FamilyMember[]> {
    await this.requireRole(familyId, userId, FamilyRole.VIEWER);
    return this.familyMemberRepository.find({
      where: { family_id: familyId, status: MemberStatus.ACTIVE },
      relations: ['user'],
    });
  }

  async updateMemberRole(
    familyId: string,
    memberId: string,
    newRole: FamilyRole,
    callerId: string,
  ): Promise<FamilyMember> {
    await this.requireRole(familyId, callerId, FamilyRole.OWNER);

    if (newRole === FamilyRole.OWNER) {
      throw new BadRequestException({
        message: 'Cannot assign OWNER role',
        code: ErrorCodes.VALIDATION_FAILED,
      });
    }

    const member = await this.familyMemberRepository.findOne({
      where: { id: memberId, family_id: familyId },
    });
    if (!member) {
      throw new NotFoundException({
        message: 'Member not found',
        code: ErrorCodes.NOT_FOUND,
      });
    }
    if (member.role === FamilyRole.OWNER) {
      throw new ForbiddenException({
        message: 'Cannot change OWNER role',
        code: ErrorCodes.ROLE_INSUFFICIENT,
      });
    }

    member.role = newRole;
    return this.familyMemberRepository.save(member);
  }

  async removeMember(
    familyId: string,
    memberId: string,
    callerId: string,
  ): Promise<void> {
    await this.requireRole(familyId, callerId, FamilyRole.OWNER);

    const member = await this.familyMemberRepository.findOne({
      where: { id: memberId, family_id: familyId },
    });
    if (!member) {
      throw new NotFoundException({
        message: 'Member not found',
        code: ErrorCodes.NOT_FOUND,
      });
    }
    if (member.role === FamilyRole.OWNER) {
      throw new ForbiddenException({
        message: 'Cannot remove OWNER from family',
        code: ErrorCodes.ROLE_INSUFFICIENT,
      });
    }

    await this.familyMemberRepository.remove(member);
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async requireRole(
    familyId: string,
    userId: string,
    minRole: FamilyRole,
  ): Promise<FamilyMember> {
    const member = await this.familyMemberRepository.findOne({
      where: { family_id: familyId, user_id: userId, status: MemberStatus.ACTIVE },
    });
    if (!member || ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[minRole]) {
      throw new ForbiddenException({
        message: `Requires ${minRole} role or above`,
        code: ErrorCodes.ROLE_INSUFFICIENT,
      });
    }
    return member;
  }

  private generateInviteCode(): string {
    // 8-char alphanumeric, uppercase for readability
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
    const bytes = randomBytes(8);
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }
}
