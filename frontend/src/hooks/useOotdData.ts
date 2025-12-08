import { useState, useEffect } from 'react';
import { OotdService, type OotdItem } from '../services/ootd';
import { BabyService } from '../services/api';

export const useOotdData = (tags?: string[]) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [items, setItems] = useState<OotdItem[]>([]);
    const [babyId, setBabyId] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            setError(undefined);

            await BabyService.ensureDevEnvironment();
            const currentBabyId = BabyService.getCurrentBabyId();
            if (!currentBabyId) throw new Error('未找到宝宝信息');
            setBabyId(currentBabyId);

            const data = await OotdService.getOotdList(currentBabyId, 1, 20, tags);
            setItems(data);
        } catch (err: any) {
            console.error('Failed to load OOTD:', err);
            setError(err.message || '加载失败，请重试');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tags?.join(',')]);

    const handleLike = async (id: string) => {
        try {
            const updated = await OotdService.likeOotd(id);
            setItems(prev => prev.map(item => item.id === id ? updated : item));
        } catch (err) {
            console.error('Failed to like:', err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await OotdService.deleteOotd(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    return {
        loading,
        error,
        items,
        babyId,
        handleLike,
        handleDelete,
        refresh: load,
    };
};
