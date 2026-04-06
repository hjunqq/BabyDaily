import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { FamilyRole } from './entities/family-member.entity';

@Controller('families')
@UseGuards(AuthGuard('jwt'))
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  /**
   * Create family — restricted to PIN/dev users only (not WeChat miniprogram).
   * The auth method is encoded in JWT by the bootstrap flow;
   * for now we keep this endpoint but the miniprogram UI won't call it.
   */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Request() req: any, @Body() dto: CreateFamilyDto) {
    return this.familyService.create(req.user.userId, dto.name);
  }

  @Get('my')
  findMyFamilies(@Request() req: any) {
    return this.familyService.findMyFamilies(req.user.userId);
  }

  // ─── Invite codes ─────────────────────────────────────────

  @Post(':familyId/invites')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createInvite(
    @Param('familyId') familyId: string,
    @Request() req: any,
    @Body() body: { role?: FamilyRole },
  ) {
    return this.familyService.createInvite(
      familyId,
      req.user.userId,
      body.role || FamilyRole.MEMBER,
    );
  }

  /**
   * Join a family using an invite code.
   * No family context needed — this is for users without a family.
   */
  @Post('join')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  joinByInvite(@Request() req: any, @Body() body: { code: string }) {
    return this.familyService.joinByInvite(body.code, req.user.userId);
  }

  // ─── Member management ────────────────────────────────────

  @Get(':familyId/members')
  getMembers(@Param('familyId') familyId: string, @Request() req: any) {
    return this.familyService.getMembers(familyId, req.user.userId);
  }

  @Get(':familyId/members/pending')
  getPendingMembers(
    @Param('familyId') familyId: string,
    @Request() req: any,
  ) {
    return this.familyService.getPendingMembers(familyId, req.user.userId);
  }

  @Post(':familyId/members/:memberId/approve')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  approveMember(
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.familyService.approveMember(
      familyId,
      memberId,
      req.user.userId,
    );
  }

  @Post(':familyId/members/:memberId/reject')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  rejectMember(
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.familyService.rejectMember(
      familyId,
      memberId,
      req.user.userId,
    );
  }

  @Patch(':familyId/members/:memberId/role')
  updateMemberRole(
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() body: { role: FamilyRole },
  ) {
    return this.familyService.updateMemberRole(
      familyId,
      memberId,
      body.role,
      req.user.userId,
    );
  }

  @Delete(':familyId/members/:memberId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removeMember(
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.familyService.removeMember(
      familyId,
      memberId,
      req.user.userId,
    );
  }
}
