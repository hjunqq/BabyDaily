import { useEffect, useState } from 'react';
import { BabyService } from '../services/api';
import type { BabyRecord } from '../types';

export const useRecords = (babyId: string | null, limit = 50, offset = 0) => {
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = async () => {
    if (!babyId) return;
    try {
      setLoading(true);
      setError(undefined);
      const data = await BabyService.getRecords(babyId, limit, offset);
      setRecords(data);
    } catch (err: any) {
      setError(err?.message || '获取记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [babyId, limit, offset]);

  return { records, loading, error, refresh: load };
};
