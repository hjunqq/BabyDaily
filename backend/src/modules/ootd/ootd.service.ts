import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ootd } from './entities/ootd.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { mapToCamelCase } from '../../common/utils/mapping';

@Injectable()
export class OotdService {
    constructor(
        @InjectRepository(Ootd)
        private ootdRepository: Repository<Ootd>,
    ) { }

    async create(userId: string, data: Partial<Ootd>): Promise<any> {
        const ootd = this.ootdRepository.create({
            ...data,
            creator_id: userId,
            date: data.date ? new Date(data.date) : new Date(),
        });
        const saved = await this.ootdRepository.save(ootd);
        return mapToCamelCase(saved);
    }

    async findAllByBaby(babyId: string, page = 1, limit = 20, tags?: string[]): Promise<any[]> {
        const where: any = { baby_id: babyId };
        if (tags && tags.length) {
            where.tags = () => `tags && ARRAY[${tags.map(t => `'${t}'`).join(',')}]`;
        }

        const items = await this.ootdRepository.find({
            where,
            order: { date: 'DESC', created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return mapToCamelCase(items);
    }

    async findByMonth(babyId: string, year: number, month: number): Promise<any[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const items = await this.ootdRepository.find({
            where: {
                baby_id: babyId,
                date: Between(startDate, endDate),
            },
            order: { date: 'ASC' },
        });
        return mapToCamelCase(items);
    }

    async findOne(id: string): Promise<any | null> {
        const item = await this.ootdRepository.findOne({ where: { id } });
        return item ? mapToCamelCase(item) : null;
    }

    async like(id: string): Promise<any> {
        const ootd = await this.ootdRepository.findOne({ where: { id } });
        if (!ootd) {
            throw new NotFoundException({
                message: 'OOTD not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        ootd.likes = (ootd.likes || 0) + 1;
        const saved = await this.ootdRepository.save(ootd);
        return mapToCamelCase(saved);
    }

    async remove(id: string): Promise<void> {
        await this.ootdRepository.delete(id);
    }
}
