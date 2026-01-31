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

type Activity = { id: string; time: string; category: string; detail: string; duration: string; type: BabyRecord['type'] };

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

      if (!summaryResp || !trendsResp) {
        throw new Error('接口返回为空，无法展示仪表盘数据');
      }

      const summary = mapSummary(summaryResp);
      const trends = mapTrends(trendsResp);
      const activities = buildActivities(records);

      setState({ loading: false, summary, trends, activities });
    } catch (err: any) {
      console.error('Dashboard data load failed:', err);
      const msg = err?.message ? `数据加载失败：${err.message}` : '数据加载失败，请稍后重试';
      setState(prev => ({
        ...prev,
        loading: false,
        error: msg,
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { ...state, refresh: load };
};

const buildActivities = (records: BabyRecord[]): Activity[] => {
  if (!records.length) return [];
  return records.slice(0, 10).map((r) => {
    const time = new Date(r.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    let detail = '';
    let duration = '-';
    if (r.type === 'FEED') {
      const details = r.details as FeedDetails;
      const amount = details?.amount ? `${details.amount}${details.unit || 'ml'}` : '';
      const method = details?.subtype === 'BREAST' ? '母乳' : details?.subtype === 'SOLID' ? '辅食' : '奶瓶';
      detail = `${method} ${amount}`.trim();
      duration = details?.duration || '-';
    } else if (r.type === 'DIAPER') {
      const t = (r.details as any)?.type;
      if (t === 'BOTH') detail = '尿 + 便';
      else if (t === 'POO') detail = '便便';
      else detail = '尿尿';
    } else if (r.type === 'SLEEP') {
      duration = '1h 30m';
      detail = '睡眠';
    }
    return {
      id: r.id,
      time,
      category: mapCategory(r.type),
      detail,
      duration,
      type: r.type,
    };
  });
};

const mapCategory = (type: BabyRecord['type']) => {
  switch (type) {
    case 'FEED':
      return '喂养';
    case 'SLEEP':
      return '睡眠';
    case 'DIAPER':
      return '尿布';
    default:
      return '记录';
  }
};

const mapSummary = (res: any): Summary => ({
  milkMl: res.milkMl ?? 0,
  diaperWet: res.diaperWet ?? 0,
  diaperSoiled: res.diaperSoiled ?? 0,
  sleepMinutes: res.sleepMinutes ?? 0,
  lastFeedTime: res.lastFeedTime ? new Date(res.lastFeedTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : undefined,
});

const mapTrends = (res: any[]): TrendPoint[] => {
  if (!Array.isArray(res) || !res.length) return [];
  return res.map(item => ({
    name: item.date?.slice(5) || '',
    milk: item.milk ?? 0,
    solid: item.solid ?? 0,
  }));
};
