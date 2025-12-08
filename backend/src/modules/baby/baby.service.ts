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
        const baby = this.babyRepository.create(data);
        return this.babyRepository.save(baby);
    }

    async findByFamily(familyId: string): Promise<Baby[]> {
        return this.babyRepository.find({ where: { family_id: familyId } });
    }

    async findOne(id: string): Promise<Baby | null> {
        return this.babyRepository.findOne({ where: { id } });
    }
}
