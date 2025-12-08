export interface Baby {
    id: string;
    family_id: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthday: string;
    blood_type?: string;
    avatar_url?: string;
}

export type RecordType = 'FEED' | 'SLEEP' | 'DIAPER' | 'BATH' | 'HEALTH' | 'GROWTH' | 'MILESTONE';

export interface BabyRecord {
    id: string;
    baby_id: string;
    creator_id: string;
    type: RecordType;
    time: string;
    end_time?: string;
    details: FeedDetails | DiaperDetails | SleepDetails | GrowthDetails | ApiRecordDetails; // fallback
    media_urls?: string[];
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
    is_nap: boolean;
    location?: string;
}

export interface GrowthDetails {
    height?: number;
    weight?: number;
    head_circumference?: number;
}

export type ApiRecordDetails = Record<string, unknown>;

export interface Family {
    id: string;
    name: string;
    creator_id: string;
}

export interface User {
    id: string;
    nickname: string;
    avatar_url: string;
}
