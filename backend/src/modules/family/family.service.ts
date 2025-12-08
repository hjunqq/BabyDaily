import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember, FamilyRole } from './entities/family-member.entity';
import { Baby } from '../baby/entities/baby.entity';

@Injectable()
export class FamilyService {
    constructor(
        @InjectRepository(Family)
        private familyRepository: Repository<Family>,
        @InjectRepository(FamilyMember)
        private familyMemberRepository: Repository<FamilyMember>,
        @InjectRepository(Baby)
        private babyRepository: Repository<Baby>,
    ) { }

    async create(userId: string, name: string): Promise<Family> {
        const family = this.familyRepository.create({
            name,
            creator_id: userId,
        });
        const savedFamily = await this.familyRepository.save(family);

        // Automatically add creator as admin
        const member = this.familyMemberRepository.create({
            family_id: savedFamily.id,
            user_id: userId,
            role: FamilyRole.ADMIN,
            relation: '创建者',
        });
        await this.familyMemberRepository.save(member);

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
            relations: ['members', 'members.user']
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
