import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember, FamilyRole } from './entities/family-member.entity';
import { Baby } from '../baby/entities/baby.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FamilyService {
    constructor(
        @InjectRepository(Family)
        private familyRepository: Repository<Family>,
        @InjectRepository(FamilyMember)
        private familyMemberRepository: Repository<FamilyMember>,
        @InjectRepository(Baby)
        private babyRepository: Repository<Baby>,
        private usersService: UsersService,
    ) { }

    async create(userId: string, name: string, openid?: string): Promise<Family> {
        // 直接使用 userId，不依赖 openid 参数
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        const effectiveUserId = user.id;

        const family = this.familyRepository.create({
            name,
            creator_id: effectiveUserId,
        });
        const savedFamily = await this.familyRepository.save(family);

        // Automatically add creator as admin
        try {
            const member = this.familyMemberRepository.create({
                family_id: savedFamily.id,
                user_id: effectiveUserId,
                role: FamilyRole.ADMIN,
                relation: 'creator',
            });
            await this.familyMemberRepository.save(member);
        } catch (error: any) {
            // 若 FamilyMember 创建失败，回滚 Family
            await this.familyRepository.remove(savedFamily);
            throw new BadRequestException(`Failed to add creator to family: ${error?.message}`);
        }

        return savedFamily;
    }

    async findMyFamilies(userId: string): Promise<Family[]> {
        const members = await this.familyMemberRepository.find({
            where: { user_id: userId },
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

    async isBabyBelongToUserFamily(babyId: string, userId: string): Promise<boolean> {
        const baby = await this.babyRepository.findOne({ where: { id: babyId } });
        if (!baby) return false;
        const member = await this.familyMemberRepository.findOne({
            where: { family_id: baby.family_id, user_id: userId },
        });
        return !!member;
    }
}
