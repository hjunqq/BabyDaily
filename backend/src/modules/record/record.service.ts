import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecordRepository } from './record.repository';
import { Record, RecordType } from './entities/record.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import {
    mapToCamelCase,
    mapDetailsToSnakeCase,
    enrichWithTimeFields,
    formatDateKey,
} from './record.mapper';

/**
 * Record Service - Business logic layer
 * Uses RecordRepository for data access and mapper for transformations
 */
@Injectable()
export class RecordService {
    constructor(private readonly recordRepo: RecordRepository) { }

    async create(userId: string, data: any): Promise<Record> {
        return this.recordRepo.create({
            baby_id: data.babyId || data.baby_id,
            creator_id: userId,
            type: data.type,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.endTime || data.end_time ? new Date(data.endTime || data.end_time) : undefined,
            details: data.details ? mapDetailsToSnakeCase(data.details) : undefined,
            remark: data.remark,
            media_urls: data.media_urls || data.mediaUrls,
        });
    }

    async findAllByBaby(babyId: string, limit = 20, offset = 0): Promise<any[]> {
        const records = await this.recordRepo.findByBabyId(babyId, limit, offset);
        const camelCaseRecords = mapToCamelCase(records);
        return enrichWithTimeFields(camelCaseRecords);
    }

    async findOneWithGuard(id: string, userId: string): Promise<any | null> {
        const rec = await this.recordRepo.findById(id);
        if (!rec) return null;
        return mapToCamelCase(rec);
    }

    async updateWithGuard(id: string, data: any, userId: string): Promise<any> {
        const existing = await this.recordRepo.findByIdSimple(id);
        if (!existing) {
            throw new NotFoundException({
                message: 'Record not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        if (existing.creator_id !== userId) {
            throw new ForbiddenException({
                message: 'No permission to modify this record',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }

        const { babyId, endTime, ...rest } = data;
        await this.recordRepo.update(id, {
            ...rest,
            baby_id: babyId || data.baby_id,
            time: data.time ? new Date(data.time) : undefined,
            end_time: endTime || data.end_time ? new Date(endTime || data.end_time) : undefined,
            details: data.details ? mapDetailsToSnakeCase(data.details) : undefined,
        });

        const updated = await this.recordRepo.findById(id);
        return mapToCamelCase(updated);
    }

    async removeWithGuard(id: string, userId: string): Promise<void> {
        const rec = await this.recordRepo.findByIdSimple(id);
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
        await this.recordRepo.delete(id);
    }

    async removeManyWithGuard(ids: string[], userId: string): Promise<void> {
        if (!ids.length) return;
        await this.recordRepo.deleteManyByCreator(ids, userId);
    }

    async removeAllByBaby(babyId: string, userId: string): Promise<void> {
        await this.recordRepo.deleteByBabyId(babyId);
    }

    async summary(babyId: string, days = 1) {
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const result = await this.recordRepo.aggregateSummary(babyId, from);
        const lastFeed = await this.recordRepo.findLastFeed(babyId);

        return {
            milkMl: parseInt(result?.milk_ml ?? '0') || 0,
            diaperWet: parseInt(result?.diaper_wet ?? '0') || 0,
            diaperSoiled: parseInt(result?.diaper_soiled ?? '0') || 0,
            sleepMinutes: parseInt(result?.sleep_minutes ?? '0') || 0,
            lastFeedTime: lastFeed?.time?.toISOString(),
        };
    }

    private getDayRange(dayStartHour: number = 0): { from: Date; to: Date } {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(dayStartHour, 0, 0, 0);

        if (now.getHours() < dayStartHour) {
            todayStart.setDate(todayStart.getDate() - 1);
        }

        return { from: todayStart, to: now };
    }

    async getFeedTimeline(babyId: string, dayStartHour: number = 0) {
        const { from, to } = this.getDayRange(dayStartHour);

        const records = await this.recordRepo.findFeedsByTimeRange(babyId, from, to);

        let totalMl = 0;
        const items = records.map(r => {
            const details = r.details as any;
            const amount = details?.amount || 0;
            if (details?.subtype !== 'BREAST') {
                totalMl += amount;
            }
            return {
                id: r.id,
                time: r.time.toISOString(),
                amount: amount,
                subtype: details?.subtype || 'BOTTLE',
                duration: details?.duration,
            };
        });

        return {
            dayStartHour,
            from: from.toISOString(),
            to: to.toISOString(),
            totalMl,
            items,
        };
    }

    async trend(babyId: string, days = 7) {
        const now = new Date();
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const rawResult = await this.recordRepo.aggregateTrend(babyId, from);

        // Build result map from DB data
        const bucket = new Map<string, { milkMl: number; solidG: number }>();
        rawResult.forEach((row: any) => {
            const dayStr = row.day instanceof Date
                ? row.day.toISOString().slice(0, 10)
                : String(row.day);
            bucket.set(dayStr, {
                milkMl: parseInt(row.milk_ml) || 0,
                solidG: parseInt(row.solid_g) || 0,
            });
        });

        // Generate result for all days in range
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = formatDateKey(d);
            const val = bucket.get(key) || { milkMl: 0, solidG: 0 };
            result.push({
                date: key,
                milkMl: val.milkMl,
                solidG: val.solidG,
            });
        }
        return result;
    }

    async exportCsv(babyId: string, limit = 200) {
        // Placeholder - existing export logic
        return '';
    }

    async importRecords(userId: string, babyId: string, records: any[]): Promise<{ count: number }> {
        const entities = records.map(data => ({
            baby_id: babyId,
            creator_id: userId,
            type: data.type,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.endTime ? new Date(data.endTime) : undefined,
            details: data.details ? mapDetailsToSnakeCase(data.details) : undefined,
            remark: data.remark,
        })) as Partial<Record>[];

        for (const entity of entities) {
            await this.recordRepo.create(entity);
        }
        return { count: entities.length };
    }
}
