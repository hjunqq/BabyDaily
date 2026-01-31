import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Record, RecordType } from './entities/record.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { mapToCamelCase } from '../../common/utils/mapping';

@Injectable()
export class RecordService {
    constructor(
        @InjectRepository(Record)
        private recordRepository: Repository<Record>,
    ) { }

    async create(userId: string, data: any): Promise<Record> {
        const record = this.recordRepository.create({
            ...data,
            baby_id: data.babyId || data.baby_id,
            creator_id: userId,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.endTime || data.end_time ? new Date(data.endTime || data.end_time) : undefined,
            details: data.details ? this.mapDetailsToSnakeCase(data.details) : undefined,
        });
        return this.recordRepository.save(record) as any;
    }

    async findAllByBaby(babyId: string, limit = 20, offset = 0): Promise<any[]> {
        const records = await this.recordRepository.find({
            where: { baby_id: babyId },
            order: { time: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['creator'],
        });
        return mapToCamelCase(records);
    }

    async findOneWithGuard(id: string, userId: string): Promise<any | null> {
        const rec = await this.recordRepository.findOne({ where: { id }, relations: ['creator'] });
        if (!rec) return null;
        return mapToCamelCase(rec);
    }

    async updateWithGuard(id: string, data: any, userId: string): Promise<any> {
        const existing = await this.recordRepository.findOne({ where: { id } });
        if (!existing) {
            throw new NotFoundException({
                message: 'Record not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        // Only creator can update
        if (existing.creator_id !== userId) {
            throw new ForbiddenException({
                message: 'No permission to modify this record',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }
        const { babyId, endTime, ...rest } = data;
        await this.recordRepository.update(id, {
            ...rest,
            baby_id: babyId || data.baby_id,
            time: data.time ? new Date(data.time) : undefined,
            end_time: endTime || data.end_time ? new Date(endTime || data.end_time) : undefined,
            details: data.details ? this.mapDetailsToSnakeCase(data.details) : undefined,
        });
        const updated = await this.recordRepository.findOne({ where: { id }, relations: ['creator'] });
        return mapToCamelCase(updated);
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
            milkMl: milk_ml,
            diaperWet: diaper_wet,
            diaperSoiled: diaper_soiled,
            sleepMinutes: sleep_minutes,
            lastFeedTime: last_feed_time,
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
                milkMl: val.milk_ml,
                solidG: val.solid_g,
            });
        }
        return result;
    }

    async exportCsv(babyId: string, limit = 200) {
        // ... (existing export logic)
    }

    async importRecords(userId: string, babyId: string, records: any[]): Promise<{ count: number }> {
        const entities = this.recordRepository.create(records.map(data => ({
            ...data,
            baby_id: babyId,
            creator_id: userId,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.endTime ? new Date(data.endTime) : undefined,
            details: data.details ? this.mapDetailsToSnakeCase(data.details) : undefined,
        })));
        await this.recordRepository.save(entities);
        return { count: entities.length };
    }

    private mapDetailsToSnakeCase(details: any): any {
        if (!details) return details;
        const mapped = { ...details };
        if (mapped.isNap !== undefined) {
            mapped.is_nap = mapped.isNap;
            delete mapped.isNap;
        }
        return mapped;
    }
}
