export interface Baby {
    id: string;
    familyId: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthday: string;
    bloodType?: string;
    avatarUrl?: string;
}

export type RecordType = 'FEED' | 'SLEEP' | 'DIAPER' | 'BATH' | 'HEALTH' | 'GROWTH' | 'MILESTONE' | 'VITA_AD' | 'VITA_D3';

export interface BabyRecord {
    id: string;
    babyId: string;
    creatorId: string;
    type: RecordType;
    time: string;
    endTime?: string;
    details: FeedDetails | DiaperDetails | SleepDetails | GrowthDetails | SupplementDetails | ApiRecordDetails;
    mediaUrls?: string[];
    remark?: string;
}

// Subtypes
export interface FeedDetails {
    subtype: 'BREAST' | 'BOTTLE' | 'SOLID';
    amount?: number;
    unit?: string;
    food?: string;
    duration?: string; // e.g. "15m" for breast
}

export interface DiaperDetails {
    type: 'PEE' | 'POO' | 'BOTH';
    color?: string;
    texture?: string;
}

export interface SleepDetails {
    isNap: boolean;
    location?: string;
}

export interface GrowthDetails {
    height?: number;
    weight?: number;
    headCircumference?: number;
}

export interface SupplementDetails {
    amount?: number;
    unit?: string;
}

export type ApiRecordDetails = Record<string, unknown>;

export interface Family {
    id: string;
    name: string;
    creatorId: string;
}

export interface User {
    id: string;
    nickname: string;
    avatarUrl: string;
}

export interface UserSettings {
    id: string;
    userId: string;
    theme: string;
    language: string;
    exportFormat: string;
    dayStartHour?: number;  // 日切时间 (0-23)
}

export interface NotificationItem {
    id: string;
    userId: string;
    title: string;
    content?: string;
    type?: string;
    isRead: boolean;
    createdAt: string;
}

// 喂奶时间线数据
export interface FeedTimelineItem {
    id: string;
    time: string;
    amount: number;
    subtype: 'BREAST' | 'BOTTLE' | 'SOLID';
    duration?: number;
    formattedTime?: string;  // 服务器预计算的时间格式（Kindle兼容）
}

export interface FeedTimelineData {
    dayStartHour: number;
    from: string;
    to: string;
    totalMl: number;
    items: FeedTimelineItem[];
}

