import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ootd } from './entities/ootd.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

@Injectable()
export class OotdService {
    constructor(
        @InjectRepository(Ootd)
        private ootdRepository: Repository<Ootd>,
    ) { }

    async create(userId: string, data: Partial<Ootd>): Promise<Ootd> {
        const ootd = this.ootdRepository.create({
            ...data,
            creator_id: userId,
            date: data.date ? new Date(data.date) : new Date(),
        });
        return this.ootdRepository.save(ootd);
    }

    async findAllByBaby(babyId: string, page = 1, limit = 20, tags?: string[]): Promise<Ootd[]> {
        const where: any = { baby_id: babyId };
        if (tags && tags.length) {
            where.tags = () => `tags && ARRAY[${tags.map(t => `'${t}'`).join(',')}]`;
        }

        return this.ootdRepository.find({
            where,
            order: { date: 'DESC', created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findByMonth(babyId: string, year: number, month: number): Promise<Ootd[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        return this.ootdRepository.find({
            where: {
                baby_id: babyId,
                date: Between(startDate, endDate),
            },
            order: { date: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Ootd | null> {
        return this.ootdRepository.findOne({ where: { id } });
    }

    async like(id: string): Promise<Ootd> {
        const ootd = await this.findOne(id);
        if (!ootd) {
            throw new NotFoundException({
                message: 'OOTD not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        ootd.likes = (ootd.likes || 0) + 1;
        return this.ootdRepository.save(ootd);
    }

    async remove(id: string): Promise<void> {
        await this.ootdRepository.delete(id);
    }
}
