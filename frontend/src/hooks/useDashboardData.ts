import { useEffect, useState } from 'react';
import { BabyService } from '../services/api';
import type { BabyRecord, FeedDetails } from '../types';

type Summary = {
    milkMl: number;
    diaperWet: number;
    diaperSoiled: number;
    sleepMinutes: number;
    lastFeedTime?: string;
};

type TrendPoint = { name: string; milk: number; solid: number };

type Activity = { id: string; time: string; category: string; detail: string; duration: string };

type State = {
    loading: boolean;
    error?: string;
    summary: Summary;
    trends: TrendPoint[];
    activities: Activity[];
};

const emptySummary: Summary = {
    milkMl: 0,
    diaperWet: 0,
    diaperSoiled: 0,
    sleepMinutes: 0,
    lastFeedTime: undefined,
};

export const useDashboardData = () => {
    const [state, setState] = useState<State>({
        loading: true,
        summary: emptySummary,
        trends: [],
        activities: [],
    });

    const load = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: undefined }));
            await BabyService.ensureDevEnvironment();
            const babyId = BabyService.getCurrentBabyId() || 'u-sakura-001';

            const records = await BabyService.getRecords(babyId, 50);
            const [summaryResp, trendsResp] = await Promise.all([
                BabyService.getSummary(babyId),
                BabyService.getTrends(babyId, 7),
            ]);

            const summary = summaryResp ? mapSummary(summaryResp) : buildSummary(records);
            const trends = trendsResp ? mapTrends(trendsResp) : buildTrends(records);
            const activities = buildActivities(records);

            setState({ loading: false, summary, trends, activities });
        } catch (err: any) {
            console.error('Dashboard data load failed:', err);
            setState(prev => ({
                ...prev,
                loading: false,
                error: '数据拉取失败，请稍后重试',
            }));
        }
    };

    useEffect(() => {
        load();
    }, []);

    return { ...state, refresh: load };
};

const buildSummary = (records: BabyRecord[]): Summary => {
    let milkMl = 0;
    let diaperWet = 0;
    let diaperSoiled = 0;
    let sleepMinutes = 0;
    let lastFeedTime: string | undefined;

    records.forEach((r) => {
        if (r.type === 'FEED') {
            const details = r.details as FeedDetails;
            if (details?.amount) milkMl += details.amount;
            if (!lastFeedTime || r.time > lastFeedTime) {
                lastFeedTime = new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }
        if (r.type === 'DIAPER') {
            const detail = (r.details as any)?.type;
            if (detail === 'PEE' || detail === 'BOTH') diaperWet += 1;
            if (detail === 'POO' || detail === 'BOTH') diaperSoiled += 1;
        }
        if (r.type === 'SLEEP') {
            const end = r.end_time ? new Date(r.end_time).getTime() : new Date(r.time).getTime() + 90 * 60000;
            const start = new Date(r.time).getTime();
            sleepMinutes += Math.max(0, Math.round((end - start) / 60000));
        }
    });

    return {
        milkMl: Math.round(milkMl),
        diaperWet,
        diaperSoiled,
        sleepMinutes,
        lastFeedTime,
    };
};

const buildTrends = (records: BabyRecord[]): TrendPoint[] => {
    if (!records.length) return [];
    const bucket: Record<string, { milk: number; solid: number }> = {};
    records.forEach((r) => {
        const day = new Date(r.time).toISOString().slice(5, 10); // MM-DD
        if (!bucket[day]) bucket[day] = { milk: 0, solid: 0 };
        if (r.type === 'FEED') {
            const details = r.details as FeedDetails;
            if (details?.subtype === 'SOLID') bucket[day].solid += details.amount || 0;
            else bucket[day].milk += details?.amount || 0;
        }
    });
    return Object.entries(bucket).map(([name, val]) => ({ name, milk: val.milk, solid: val.solid }));
};

const buildActivities = (records: BabyRecord[]): Activity[] => {
    if (!records.length) return [];
    return records.slice(0, 10).map((r) => {
        const time = new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let detail = '';
        let duration = '-';
        if (r.type === 'FEED') {
            const details = r.details as FeedDetails;
            const amount = details?.amount ? `${details.amount}${details.unit || 'ml'}` : '';
            detail = `${details?.subtype === 'BREAST' ? '母乳' : '配方奶'} ${amount}`.trim();
            duration = details?.duration || '-';
        } else if (r.type === 'DIAPER') {
            detail = (r.details as any)?.type === 'BOTH' ? '湿 + 脏' : (r.details as any)?.type === 'POO' ? '脏' : '湿';
        } else if (r.type === 'SLEEP') {
            duration = '1h 30m';
            detail = '小睡';
        }
        return {
            id: r.id,
            time,
            category: mapCategory(r.type),
            detail,
            duration,
        };
    });
};

const mapCategory = (type: BabyRecord['type']) => {
    switch (type) {
        case 'FEED':
            return '喂奶';
        case 'SLEEP':
            return '睡眠';
        case 'DIAPER':
            return '尿布';
        default:
            return '记录';
    }
};

const mapSummary = (res: any): Summary => ({
    milkMl: res.milk_ml ?? 0,
    diaperWet: res.diaper_wet ?? 0,
    diaperSoiled: res.diaper_soiled ?? 0,
    sleepMinutes: res.sleep_minutes ?? 0,
    lastFeedTime: res.last_feed_time ? new Date(res.last_feed_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
});

const mapTrends = (res: any[]): TrendPoint[] => {
    if (!Array.isArray(res) || !res.length) return [];
    return res.map(item => ({
        name: item.date?.slice(5) || '',
        milk: item.milk_ml ?? 0,
        solid: item.solid_g ?? 0,
    }));
};
