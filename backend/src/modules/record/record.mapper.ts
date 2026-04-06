import { Record } from './entities/record.entity';

/**
 * Record Mapper - Transformation utilities
 * Handles all data mapping and formatting
 */

/**
 * Convert snake_case to camelCase for API responses
 */
export function mapToCamelCase(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item) => mapToCamelCase(item));
  }

  if (data && typeof data === 'object' && !(data instanceof Date)) {
    const result: any = {};
    for (const key in data) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      result[camelKey] = mapToCamelCase(data[key]);
    }
    return result;
  }

  return data;
}

/**
 * Convert camelCase details to snake_case for storage
 */
export function mapDetailsToSnakeCase(details: any): any {
  if (!details) return details;
  const mapped = { ...details };
  if (mapped.isNap !== undefined) {
    mapped.is_nap = mapped.isNap;
    delete mapped.isNap;
  }
  return mapped;
}

/** Allowed units to prevent injection via the unit field */
const ALLOWED_UNITS = new Set(['ml', 'g', 'min', '粒', 'kg', 'cm', 'oz']);

/**
 * Sanitize details to a strict whitelist of known-safe fields.
 * Drops any unknown keys. Coerces numeric fields to numbers.
 * Returns null if details is not an object.
 */
export function sanitizeDetails(type: string, details: any): any {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return undefined;

  const safe: any = {};

  switch (type) {
    case 'FEED': {
      const FEED_SUBTYPES = ['BOTTLE', 'BREAST', 'SOLID'];
      if (details.subtype && FEED_SUBTYPES.includes(String(details.subtype))) {
        safe.subtype = details.subtype;
      }
      if (details.amount !== undefined) {
        const v = Number(details.amount);
        if (Number.isFinite(v) && v >= 0 && v <= 5000) safe.amount = v;
      }
      if (details.unit !== undefined) {
        const u = String(details.unit).trim().toLowerCase();
        safe.unit = ALLOWED_UNITS.has(u) ? u : 'ml';
      }
      if (details.duration !== undefined) {
        const v = Number(details.duration);
        if (Number.isFinite(v) && v >= 0 && v <= 1440) safe.duration = v;
      }
      break;
    }
    case 'DIAPER': {
      const DIAPER_TYPES = ['PEE', 'POO', 'BOTH'];
      if (details.type && DIAPER_TYPES.includes(String(details.type))) {
        safe.type = details.type;
      }
      break;
    }
    case 'SLEEP': {
      if (details.duration !== undefined) {
        const v = Number(details.duration);
        if (Number.isFinite(v) && v >= 0 && v <= 1440) safe.duration = v;
      }
      const isNapVal = details.isNap ?? details.is_nap;
      if (isNapVal !== undefined) safe.is_nap = Boolean(isNapVal);
      break;
    }
    case 'BATH': {
      if (details.duration !== undefined) {
        const v = Number(details.duration);
        if (Number.isFinite(v) && v >= 0 && v <= 300) safe.duration = v;
      }
      if (details.unit !== undefined) {
        const u = String(details.unit).trim().toLowerCase();
        safe.unit = ALLOWED_UNITS.has(u) ? u : 'min';
      }
      break;
    }
    case 'VITA_AD':
    case 'VITA_D3': {
      if (details.amount !== undefined) {
        const v = Number(details.amount);
        if (Number.isFinite(v) && v >= 0 && v <= 100) safe.amount = v;
      }
      // unit must be exactly '粒'
      safe.unit = '粒';
      break;
    }
    case 'HEALTH':
    case 'GROWTH': {
      // Allow only numeric measurement fields
      for (const key of ['weight', 'height', 'temperature', 'value']) {
        if (details[key] !== undefined) {
          const v = Number(details[key]);
          if (Number.isFinite(v) && v >= 0) safe[key] = v;
        }
      }
      if (details.unit !== undefined) {
        const u = String(details.unit).trim().toLowerCase();
        safe.unit = ALLOWED_UNITS.has(u) ? u : undefined;
      }
      break;
    }
    default:
      // MILESTONE and unknown types: allow nothing sensitive
      break;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

/**
 * Calculate time ago string in Chinese (using Beijing timezone)
 */
export function getTimeAgo(date: Date): string {
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
 * Format time as HH:MM in Beijing timezone (Asia/Shanghai)
 */
export function formatTime(date: Date): string {
  // 使用北京时区格式化时间
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });
}

/**
 * Calculate elapsed milliseconds from a date to now
 */
export function getElapsedMs(date: Date): number {
  return new Date().getTime() - date.getTime();
}

/**
 * Enrich records with server-calculated time fields for Kindle compatibility
 */
export function enrichWithTimeFields(records: any[]): any[] {
  return records.map((record: any) => {
    const recordTime = new Date(record.time);
    return {
      ...record,
      timeAgo: getTimeAgo(recordTime),
      formattedTime: formatTime(recordTime),
      elapsedMs: getElapsedMs(recordTime),
    };
  });
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
