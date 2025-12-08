import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BabyService } from '../../services/api';
import { Button } from '../common';
import type { FeedDetails, DiaperDetails } from '../../types';

interface RecordEditFormProps {
    recordId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type RecordType = 'FEED' | 'SLEEP' | 'DIAPER';

const isFeedDetails = (d: any): d is FeedDetails => d && typeof d === 'object' && 'subtype' in d;
const isDiaperDetails = (d: any): d is DiaperDetails => d && typeof d === 'object' && 'type' in d;

export const RecordEditForm = ({ recordId, onClose, onSuccess }: RecordEditFormProps) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [type, setType] = useState<RecordType>('FEED');
    const [time, setTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [amount, setAmount] = useState('');
    const [diaperType, setDiaperType] = useState('PEE');

    useEffect(() => {
        const loadRecord = async () => {
            try {
                const record = await BabyService.getRecord(recordId);
                setType(record.type as RecordType);
                setTime(new Date(record.time).toISOString().slice(0, 16));
                if (record.end_time) {
                    setEndTime(new Date(record.end_time).toISOString().slice(0, 16));
                }
                if (isFeedDetails(record.details) && record.details.amount) {
                    setAmount(record.details.amount.toString());
                }
                if (isDiaperDetails(record.details) && record.details.type) {
                    setDiaperType(record.details.type);
                }
            } catch (err) {
                setError('加载记录失败');
            } finally {
                setLoading(false);
            }
        };

        loadRecord();
    }, [recordId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            let details: any = {};

            if (type === 'FEED') {
                if (!amount) throw new Error('请输入奶量');
                details = {
                    amount: parseInt(amount, 10),
                    unit: 'ml',
                    subtype: 'FORMULA',
                };
            } else if (type === 'DIAPER') {
                details = { type: diaperType };
            }

            await BabyService.updateRecord(recordId, {
                type,
                time: new Date(time).toISOString(),
                end_time: endTime ? new Date(endTime).toISOString() : undefined,
                details,
            } as any);

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || '更新失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                    <div className="text-center">加载中...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-sakura-text">编辑记录</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="关闭"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sakura-text mb-2">记录类型</label>
                        <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                            {type === 'FEED' ? '喂奶' : type === 'SLEEP' ? '睡眠' : '尿布'}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sakura-text mb-2">开始时间</label>
                        <input
                            type="datetime-local"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-pink focus:border-sakura-pink outline-none"
                            required
                        />
                    </div>

                    {type === 'FEED' && (
                        <div>
                            <label className="block text-sm font-medium text-sakura-text mb-2">奶量 (ml)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-pink focus:border-sakura-pink outline-none"
                                placeholder="如：120"
                                required
                            />
                        </div>
                    )}

                    {type === 'SLEEP' && (
                        <div>
                            <label className="block text-sm font-medium text-sakura-text mb-2">结束时间</label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sakura-pink focus:border-sakura-pink outline-none"
                            />
                        </div>
                    )}

                    {type === 'DIAPER' && (
                        <div>
                            <label className="block text-sm font-medium text-sakura-text mb-2">类型</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['PEE', 'POO', 'BOTH'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setDiaperType(t)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${diaperType === t
                                                ? 'bg-sakura-pink text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {t === 'PEE' ? '湿' : t === 'POO' ? '脏' : '湿 + 脏'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            取消
                        </Button>
                        <Button type="submit" variant="primary" loading={saving} disabled={saving} className="flex-1">
                            {saving ? '保存中…' : '保存'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
