import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Baby } from './entities/baby.entity';

@Injectable()
export class BabyService {
    constructor(
        @InjectRepository(Baby)
        private babyRepository: Repository<Baby>,
    ) { }

    async create(data: Partial<Baby>): Promise<Baby> {
        const baby = this.babyRepository.create({
            ...data,
            gender: data.gender as any,
            birthday: data.birthday ? new Date(data.birthday) : undefined,
        });
        return this.babyRepository.save(baby);
    }

    async findByFamily(familyId: string): Promise<Baby[]> {
        return this.babyRepository.find({ where: { family_id: familyId } });
    }

    async findOne(id: string): Promise<Baby | null> {
        return this.babyRepository.findOne({ where: { id } });
    }

    async update(id: string, updates: Partial<Baby>): Promise<Baby> {
        await this.babyRepository.update(id, updates);
        const updated = await this.findOne(id);
        if (!updated) {
            throw new Error('Baby not found after update');
        }
        return updated;
    }
}
