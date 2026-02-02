import { useEffect, useState } from 'react';
import { BabyService } from '../services/api';
import type { BabyRecord } from '../types';

export const useRecords = (babyId: string | null, pageSize = 20) => {
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const load = async (reset = false) => {
    if (!babyId) return;
    try {
      setLoading(true);
      setError(undefined);
      const currentOffset = reset ? 0 : offset;
      const data = await BabyService.getRecords(babyId, pageSize, currentOffset);

      if (reset) {
        setRecords(data);
        setOffset(pageSize);
      } else {
        setRecords(prev => [...prev, ...data]);
        setOffset(prev => prev + pageSize);
      }

      if (data.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      setError(err?.message || '获取记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (babyId) {
      load(true);
    }
  }, [babyId]);

  return {
    records,
    loading,
    error,
    hasMore,
    loadMore: () => load(false),
    refresh: () => load(true)
  };
};
