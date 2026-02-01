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

    /**
     * Calculate time ago string in Chinese
     * @param date The date to calculate from
     * @returns Time ago string like "2小时30分钟前"
     */
    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;

        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;

        if (hours < 24) {
            return mins > 0 ? `${hours}小时${mins}分钟前` : `${hours}小时前`;
        }

        const days = Math.floor(hours / 24);
        return `${days}天前`;
    }

    /**
     * Format time as HH:MM
     * @param date The date to format
     * @returns Formatted time string like "14:30"
     */
    private formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Calculate elapsed milliseconds from a date to now
     * @param date The date to calculate from
     * @returns Elapsed milliseconds
     */
    private getElapsedMs(date: Date): number {
        const now = new Date();
        return now.getTime() - date.getTime();
    }

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

        // First convert to camelCase
        const camelCaseRecords = mapToCamelCase(records);

        // Then enrich with server-calculated time fields for Kindle compatibility
        const enrichedRecords = camelCaseRecords.map((record: any) => {
            const recordTime = new Date(record.time);
            return {
                ...record,
                timeAgo: this.getTimeAgo(recordTime),
                formattedTime: this.formatTime(recordTime),
                elapsedMs: this.getElapsedMs(recordTime),
            };
        });

        return enrichedRecords;
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
        const rec = await this.recordRepository.findOne({ where: { id } });
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
    async removeManyWithGuard(ids: string[], userId: string): Promise<void> {
        if (!ids.length) return;

        // 验证这些记录是否都属于该用户有权操作的家庭
        // 简化起见，这里假设只检查第一条记录的权限，或者直接执行带条件的删除
        // 更严谨的做法是查询出所有记录并检查 creator_id，但这里为了性能使用 QueryBuilder
        // 限制条件：creator_id 必须是当前用户 (因为 update/remove 都有这个限制)

        await this.recordRepository.createQueryBuilder()
            .delete()
            .from(Record)
            .where("id IN (:...ids)", { ids })
            .andWhere("creator_id = :userId", { userId })
            .execute();
    }

    async removeAllByBaby(babyId: string, userId: string): Promise<void> {
        await this.recordRepository.delete({ baby_id: babyId });
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

    /**
     * 获取基于日切时间的日期范围
     * @param dayStartHour 一天开始的小时 (0-23)
     * @returns { from, to } 日期范围
     */
    private getDayRange(dayStartHour: number = 0): { from: Date; to: Date } {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(dayStartHour, 0, 0, 0);

        // 如果当前时间早于日切时间，说明"今天"实际上从昨天开始
        if (now.getHours() < dayStartHour) {
            todayStart.setDate(todayStart.getDate() - 1);
        }

        const from = todayStart;
        const to = now;

        return { from, to };
    }

    /**
     * 获取今日喂奶时间线
     * @param babyId 宝宝ID
     * @param dayStartHour 日切时间(小时)
     */
    async getFeedTimeline(babyId: string, dayStartHour: number = 0) {
        const { from, to } = this.getDayRange(dayStartHour);

        const records = await this.recordRepository.find({
            where: {
                baby_id: babyId,
                type: RecordType.FEED,
                time: Between(from, to),
            },
            order: { time: 'ASC' },
        });

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
