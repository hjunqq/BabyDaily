import { ForbiddenException } from '@nestjs/common';
import { FamilyService } from './family.service';
import {
  FamilyMember,
  FamilyRole,
  MemberStatus,
} from './entities/family-member.entity';

describe('FamilyService pending approvals', () => {
  const createService = () => {
    const familyRepository = {};
    const familyMemberRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    const inviteRepository = {};
    const babyRepository = {};
    const usersService = {};

    const service = new FamilyService(
      familyRepository as any,
      familyMemberRepository as any,
      inviteRepository as any,
      babyRepository as any,
      usersService as any,
    );

    return { service, familyMemberRepository };
  };

  const makeMember = (
    overrides: Partial<FamilyMember> = {},
  ): FamilyMember =>
    ({
      id: 'member-id',
      family_id: 'family-id',
      user_id: 'user-id',
      role: FamilyRole.MEMBER,
      status: MemberStatus.ACTIVE,
      relation: null,
      family: null,
      user: null,
      created_at: new Date(),
      ...overrides,
    }) as FamilyMember;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lets guardians list pending members they can approve', async () => {
    const { service, familyMemberRepository } = createService();
    familyMemberRepository.findOne.mockResolvedValueOnce(
      makeMember({
        role: FamilyRole.GUARDIAN,
        status: MemberStatus.ACTIVE,
      }),
    );
    familyMemberRepository.find.mockResolvedValueOnce([
      makeMember({
        id: 'viewer-pending',
        role: FamilyRole.VIEWER,
        status: MemberStatus.PENDING,
      }),
      makeMember({
        id: 'member-pending',
        role: FamilyRole.MEMBER,
        status: MemberStatus.PENDING,
      }),
      makeMember({
        id: 'guardian-pending',
        role: FamilyRole.GUARDIAN,
        status: MemberStatus.PENDING,
      }),
    ]);

    const pending = await service.getPendingMembers('family-id', 'guardian-id');

    expect(pending.map((member) => member.id)).toEqual([
      'viewer-pending',
      'member-pending',
    ]);
  });

  it('lets guardians approve member or viewer requests', async () => {
    const { service, familyMemberRepository } = createService();
    const pendingMember = makeMember({
      id: 'pending-member',
      role: FamilyRole.MEMBER,
      status: MemberStatus.PENDING,
    });

    familyMemberRepository.findOne
      .mockResolvedValueOnce(
        makeMember({
          id: 'guardian-approver',
          role: FamilyRole.GUARDIAN,
          status: MemberStatus.ACTIVE,
        }),
      )
      .mockResolvedValueOnce(pendingMember);
    familyMemberRepository.save.mockImplementation(async (member) => member);

    const approved = await service.approveMember(
      'family-id',
      'pending-member',
      'guardian-approver',
    );

    expect(approved.status).toBe(MemberStatus.ACTIVE);
    expect(familyMemberRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pending-member',
        status: MemberStatus.ACTIVE,
      }),
    );
  });

  it('prevents guardians from approving guardian requests', async () => {
    const { service, familyMemberRepository } = createService();

    familyMemberRepository.findOne
      .mockResolvedValueOnce(
        makeMember({
          id: 'guardian-approver',
          role: FamilyRole.GUARDIAN,
          status: MemberStatus.ACTIVE,
        }),
      )
      .mockResolvedValueOnce(
        makeMember({
          id: 'guardian-pending',
          role: FamilyRole.GUARDIAN,
          status: MemberStatus.PENDING,
        }),
      );

    await expect(
      service.approveMember('family-id', 'guardian-pending', 'guardian-approver'),
    ).rejects.toThrow(ForbiddenException);
  });
});
