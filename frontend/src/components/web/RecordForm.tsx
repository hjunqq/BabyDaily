import { useState } from 'react';
import { X } from 'lucide-react';
import { BabyService } from '../../services/api';
import { Button } from '../common';

interface RecordFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

type RecordType = 'FEED' | 'SLEEP' | 'DIAPER' | 'BATH';

export const RecordForm = ({ onClose, onSuccess }: RecordFormProps) => {
    const [type, setType] = useState<RecordType>('FEED');
    const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
    const [endTime, setEndTime] = useState('');
    const [amount, setAmount] = useState('');
    const [diaperType, setDiaperType] = useState('PEE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validate = () => {
        if (type === 'FEED') {
            const num = parseInt(amount, 10);
            if (Number.isNaN(num) || num <= 0) {
                throw new Error('请输入大于 0 的奶量');
            }
        }
        if (!time) {
            throw new Error('请选择开始时间');
        }
        if (type === 'SLEEP' && endTime && new Date(endTime) < new Date(time)) {
            throw new Error('结束时间需晚于开始时间');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            validate();
            const babyId = BabyService.getCurrentBabyId() || (await BabyService.ensureDevEnvironment()).id;
            if (!babyId) throw new Error('未找到宝宝信息');

            let details: any = {};

            if (type === 'FEED') {
                details = {
                    amount: parseInt(amount, 10),
                    unit: 'ml',
                    subtype: 'FORMULA',
                };
            } else if (type === 'DIAPER') {
                details = { type: diaperType };
            } else if (type === 'SLEEP') {
                details = { is_nap: true };
            }

            await BabyService.createRecord({
                babyId: babyId,
                type,
                time: new Date(time).toISOString(),
                endTime: endTime ? new Date(endTime).toISOString() : undefined,
                details,
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || '创建失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-sakura-text">添加记录</h2>
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
                        <div className="grid grid-cols-3 gap-2">
                            {(['FEED', 'SLEEP', 'DIAPER', 'BATH'] as RecordType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${type === t
                                        ? 'bg-sakura-pink text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {t === 'FEED' ? '喂养' : t === 'SLEEP' ? '睡眠' : t === 'DIAPER' ? '尿布' : '洗澡'}
                                </button>
                            ))}
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
                                placeholder="例如：120"
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
                                        {t === 'PEE' ? '尿' : t === 'POO' ? '便' : '尿+便'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'BATH' && (
                        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            洗澡记录默认按当前时间保存，可在备注里填写时长和细节。
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
                        <Button type="submit" variant="primary" loading={loading} disabled={loading} className="flex-1">
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
