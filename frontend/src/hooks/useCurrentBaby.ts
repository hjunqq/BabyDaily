import { useEffect, useState } from 'react';
import { BabyService } from '../services/api';
import type { Baby } from '../types';

export const useCurrentBaby = () => {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const current = await BabyService.ensureDevEnvironment();
      setBaby(current);
    } catch (err: any) {
      setError(err?.message || '获取宝宝信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { baby, loading, error, refresh: load };
};
