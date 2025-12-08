import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Record, RecordType } from './entities/record.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

@Injectable()
export class RecordService {
    constructor(
        @InjectRepository(Record)
        private recordRepository: Repository<Record>,
    ) { }

    async create(userId: string, data: Partial<Record>): Promise<Record> {
        const record = this.recordRepository.create({
            ...data,
            creator_id: userId,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.end_time ? new Date(data.end_time) : undefined,
        });
        return this.recordRepository.save(record);
    }

    async findAllByBaby(babyId: string, limit = 20, offset = 0): Promise<Record[]> {
        return this.recordRepository.find({
            where: { baby_id: babyId },
            order: { time: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['creator'],
        });
    }

    async findOneWithGuard(id: string, userId: string): Promise<Record | null> {
        const rec = await this.recordRepository.findOne({ where: { id } });
        if (!rec) return null;
        // FamilyGuard already checks baby ownership; creator check applies only to write operations
        return rec;
    }

    async updateWithGuard(id: string, data: Partial<Record>, userId: string): Promise<Record> {
        const rec = await this.findOneWithGuard(id, userId);
        if (!rec) {
            throw new NotFoundException({
                message: 'Record not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        // Only creator can update
        if (rec.creator_id !== userId) {
            throw new ForbiddenException({
                message: 'No permission to modify this record',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }
        await this.recordRepository.update(id, {
            ...data,
            time: data.time ? new Date(data.time) : undefined,
            end_time: data.end_time ? new Date(data.end_time) : undefined,
        });
        return this.recordRepository.findOne({ where: { id } }) as Promise<Record>;
    }

    async removeWithGuard(id: string, userId: string): Promise<void> {
        const rec = await this.findOneWithGuard(id, userId);
        if (!rec) {
            throw new NotFoundException({
                message: 'Record not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        if (rec.creator_id !== userId) {
            throw new ForbiddenException({
                message: 'No permission to delete this record',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }
        await this.recordRepository.delete(id);
    }

    async summary(babyId: string, days = 1) {
        const now = new Date();
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const records = await this.recordRepository.find({
            where: { baby_id: babyId, time: Between(from, now) },
            order: { time: 'DESC' },
        });

        let milk_ml = 0;
        let diaper_wet = 0;
        let diaper_soiled = 0;
        let sleep_minutes = 0;
        let last_feed_time: string | undefined;

        records.forEach((r) => {
            if (r.type === RecordType.FEED) {
                const amount = (r.details as any)?.amount;
                if (typeof amount === 'number') milk_ml += amount;
                if (!last_feed_time) last_feed_time = r.time.toISOString();
            }
            if (r.type === RecordType.DIAPER) {
                const t = (r.details as any)?.type;
                if (t === 'PEE' || t === 'BOTH') diaper_wet += 1;
                if (t === 'POO' || t === 'BOTH') diaper_soiled += 1;
            }
            if (r.type === RecordType.SLEEP) {
                const end = r.end_time ? new Date(r.end_time).getTime() : new Date(r.time).getTime() + 90 * 60000;
                const start = new Date(r.time).getTime();
                sleep_minutes += Math.max(0, Math.round((end - start) / 60000));
            }
        });

        return {
            milk_ml,
            diaper_wet,
            diaper_soiled,
            sleep_minutes,
            last_feed_time,
        };
    }

    async trend(babyId: string, days = 7) {
        const now = new Date();
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const records = await this.recordRepository.find({
            where: { baby_id: babyId, time: Between(from, now) },
            order: { time: 'ASC' },
        });

        const bucket = new Map<string, { milk_ml: number; solid_g: number }>();
        const fmt = (d: Date) => d.toISOString().slice(0, 10);

        records.forEach((r) => {
            const day = fmt(r.time);
            if (!bucket.has(day)) bucket.set(day, { milk_ml: 0, solid_g: 0 });
            const entry = bucket.get(day)!;
            if (r.type === RecordType.FEED) {
                const details = (r.details as any) || {};
                if (details.subtype === 'SOLID') {
                    entry.solid_g += details.amount || 0;
                } else {
                    entry.milk_ml += details.amount || 0;
                }
            }
        });

        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = fmt(d);
            const val = bucket.get(key) || { milk_ml: 0, solid_g: 0 };
            result.push({
                date: key,
                milk_ml: val.milk_ml,
                solid_g: val.solid_g,
            });
        }
        return result;
    }

    async exportCsv(babyId: string, limit = 200) {
        const records = await this.recordRepository.find({
            where: { baby_id: babyId },
            order: { time: 'DESC' },
            take: limit,
        });
        const header = ['time', 'type', 'details', 'remark'].join(',');
        const rows = records.map((r) => {
            const detailStr = r.details ? JSON.stringify(r.details).replace(/"/g, '""') : '';
            const remarkStr = r.remark ? r.remark.replace(/"/g, '""') : '';
            return `"${r.time.toISOString()}","${r.type}","${detailStr}","${remarkStr}"`;
        });
        return [header, ...rows].join('\n');
    }
}
