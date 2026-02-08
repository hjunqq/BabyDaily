import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RecordRepository } from './record.repository';
import { Record, RecordType } from './entities/record.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import {
  mapToCamelCase,
  mapDetailsToSnakeCase,
  enrichWithTimeFields,
} from './record.mapper';
import { SettingsService } from '../settings/settings.service';

/**
 * Record Service - Business logic layer
 * Uses RecordRepository for data access and mapper for transformations
 */
@Injectable()
export class RecordService {
  constructor(
    private readonly recordRepo: RecordRepository,
    private readonly settingsService: SettingsService,
  ) {}

  async create(userId: string, data: any): Promise<Record> {
    return this.recordRepo.create({
      baby_id: data.babyId || data.baby_id,
      creator_id: userId,
      type: data.type,
      time: data.time ? new Date(data.time) : new Date(),
      end_time:
        data.endTime || data.end_time
          ? new Date(data.endTime || data.end_time)
          : undefined,
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
      end_time:
        endTime || data.end_time
          ? new Date(endTime || data.end_time)
          : undefined,
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

  async summary(babyId: string, userId: string) {
    let dayStartHour = 0;
    if (userId) {
      const settings = await this.settingsService.getOrCreate(userId);
      dayStartHour = settings.dayStartHour || 0;
    }

    const { from } = this.getDayRange(dayStartHour);

    const result = await this.recordRepo.aggregateSummary(babyId, from);
    const latestTimes = await this.recordRepo.getLatestEventTimes(babyId);

    return {
      milkMl: parseInt(result?.milk_ml ?? '0') || 0,
      diaperWet: parseInt(result?.diaper_wet ?? '0') || 0,
      diaperSoiled: parseInt(result?.diaper_soiled ?? '0') || 0,
      sleepMinutes: parseInt(result?.sleep_minutes ?? '0') || 0,
      lastFeedTime: latestTimes?.last_feed_time
        ? new Date(latestTimes.last_feed_time).toISOString()
        : undefined,
      lastDiaperTime: latestTimes?.last_diaper_time
        ? new Date(latestTimes.last_diaper_time).toISOString()
        : undefined,
      lastPeeTime: latestTimes?.last_pee_time
        ? new Date(latestTimes.last_pee_time).toISOString()
        : undefined,
      lastPooTime: latestTimes?.last_poo_time
        ? new Date(latestTimes.last_poo_time).toISOString()
        : undefined,
      lastBathTime: latestTimes?.last_bath_time
        ? new Date(latestTimes.last_bath_time).toISOString()
        : undefined,
      feedCount: parseInt(result?.feed_count ?? '0') || 0,
      todayAdTaken: (parseInt(result?.ad_taken ?? '0') || 0) > 0,
      todayD3Taken: (parseInt(result?.d3_taken ?? '0') || 0) > 0,
    };
  }

  private getDayRange(dayStartHour: number = 0): { from: Date; to: Date } {
    const now = new Date();
    // Adjust to China Time (+8) for calculation
    // Create a 'Fake UTC' Date that represents local China time
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const startTarget = new Date(chinaTime);
    startTarget.setUTCHours(dayStartHour, 0, 0, 0);

    // If current china hour < start hour, it means we are in the early morning of 'calendar day',
    // but 'logical day' is yesterday.
    if (chinaTime.getUTCHours() < dayStartHour) {
      startTarget.setUTCDate(startTarget.getUTCDate() - 1);
    }

    // Convert back to Real UTC by subtracting offset
    const from = new Date(startTarget.getTime() - 8 * 60 * 60 * 1000);
    return { from, to: now };
  }

  async getFeedTimeline(babyId: string, dayStartHour: number = 0) {
    const { from, to } = this.getDayRange(dayStartHour);

    const records = await this.recordRepo.findFeedsByTimeRange(
      babyId,
      from,
      to,
    );

    let totalMl = 0;
    const items = records.map((r) => {
      const details = r.details;
      const amount = details?.amount || 0;
      if (details?.subtype !== 'BREAST') {
        totalMl += amount;
      }
      // 使用北京时区格式化时间，确保 Kindle 兼容
      const formattedTime = r.time.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai',
      });
      return {
        id: r.id,
        time: r.time.toISOString(),
        formattedTime, // 服务器预计算的时间，Kindle 直接使用
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

  async trend(babyId: string, days = 7, userId?: string) {
    let dayStartHour = 0;
    if (userId) {
      const settings = await this.settingsService.getOrCreate(userId);
      dayStartHour = settings.dayStartHour || 0;
    }

    const now = new Date();
    const from = new Date(now.getTime() - (days + 1) * 24 * 60 * 60 * 1000);

    const rawResult = await this.recordRepo.aggregateTrend(
      babyId,
      from,
      dayStartHour,
    );

    // Build result map from DB data
    const bucket = new Map<string, { milkMl: number; solidG: number }>();
    rawResult.forEach((row: any) => {
      const dayStr = String(row.day);
      bucket.set(dayStr, {
        milkMl: parseInt(row.milk_ml) || 0,
        solidG: parseInt(row.solid_g) || 0,
      });
    });

    // Generate result for all days in range
    // Must use the same logic as the SQL query:
    // SQL: TO_CHAR(r.time - interval '${dayStartHour} hours', 'YYYY-MM-DD')
    // Since r.time displays as China Time in PostgreSQL, we:
    // 1. Convert current UTC time to China Time (+8h)
    // 2. Subtract dayStartHour hours
    // 3. Extract the date
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const chinaTime = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      const shiftedTime = new Date(
        chinaTime.getTime() - dayStartHour * 60 * 60 * 1000,
      );
      const key = shiftedTime.toISOString().slice(0, 10);
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

  async importRecords(
    userId: string,
    babyId: string,
    records: any[],
  ): Promise<{ count: number }> {
    const entities = records.map((data) => ({
      baby_id: babyId,
      creator_id: userId,
      type: data.type,
      time: data.time ? new Date(data.time) : new Date(),
      end_time: data.endTime ? new Date(data.endTime) : undefined,
      details: data.details ? mapDetailsToSnakeCase(data.details) : undefined,
      remark: data.remark,
    })) as Partial<Record>[];

    await this.recordRepo.saveMany(entities);
    return { count: entities.length };
  }
}
