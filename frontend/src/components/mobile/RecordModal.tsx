import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Milk, Baby, Moon, X, Check, Droplets, Trash2 } from 'lucide-react';
import { BabyService } from '../../services/api';
import type { RecordType, BabyRecord } from '../../types';

interface RecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecordUpdated: () => void; // Generic callback
    initialData?: BabyRecord | null;
}

const RECORD_TYPES: { type: RecordType; label: string; icon: any; color: string; bg: string }[] = [
    { type: 'FEED', label: 'Feed', icon: Milk, color: 'text-blue-500', bg: 'bg-blue-100' },
    { type: 'DIAPER', label: 'Diaper', icon: Baby, color: 'text-orange-500', bg: 'bg-orange-100' },
    { type: 'SLEEP', label: 'Sleep', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-100' },
];

export const RecordModal = ({ isOpen, onClose, onRecordUpdated, initialData }: RecordModalProps) => {
    const { theme } = useTheme();
    const [step, setStep] = useState<'TYPE' | 'DETAILS'>('TYPE');
    const [selectedType, setSelectedType] = useState<RecordType | null>(null);
    const [details, setDetails] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [babyId, setBabyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ensureEnv = async () => {
            await BabyService.ensureDevEnvironment();
            setBabyId(BabyService.getCurrentBabyId());
        };
        if (isOpen) {
            ensureEnv();
            if (initialData) {
                // Edit Mode
                setSelectedType(initialData.type);
                setDetails(initialData.details);
                setStep('DETAILS');
            } else {
                // Create Mode
                setStep('TYPE');
                setSelectedType(null);
                setDetails({});
            }
            setShowDeleteConfirm(false);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleTypeSelect = (type: RecordType) => {
        setSelectedType(type);
        setStep('DETAILS');
        // Reset details based on type
        if (type === 'FEED') setDetails({ subtype: 'BOTTLE', amount: 100, unit: 'ml' });
        if (type === 'DIAPER') setDetails({ type: 'PEE' });
        if (type === 'SLEEP') setDetails({ is_nap: true, duration: 90 }); // default 1.5h
    };

    const handleSubmit = async () => {
        if (!selectedType || !babyId) return;
        setIsSubmitting(true);
        setError(null);
        try {
            if (initialData) {
                await BabyService.updateRecord(initialData.id, {
                    details: details,
                });
            } else {
                if (selectedType === 'FEED') {
                    const num = parseInt(details.amount || '0', 10);
                    if (Number.isNaN(num) || num <= 0) throw new Error('请输入大于 0 的奶量');
                }
                if (selectedType === 'SLEEP' && !details.duration) {
                    setDetails({ ...details, duration: 90 });
                }
                await BabyService.createRecord({
                    type: selectedType,
                    baby_id: babyId,
                    time: new Date().toISOString(),
                    details: details
                });
            }
            onRecordUpdated();
            onClose();
        } catch (error) {
            console.error(error);
            setError((error as any)?.message || '保存失败');
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;

        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await BabyService.deleteRecord(initialData.id);
            onRecordUpdated();
            onClose();
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    const renderForm = () => {
        switch (selectedType) {
            case 'FEED':
                return (
                    <div className="space-y-6">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                            {['BREAST', 'BOTTLE', 'SOLID'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setDetails({ ...details, subtype: st })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${details.subtype === st ? 'bg-white shadow-sm text-sakura-text' : 'text-gray-400'}`}
                                >
                                    {st.charAt(0) + st.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {details.subtype !== 'BREAST' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2">Amount (ml)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="300"
                                        step="10"
                                        value={details.amount || 0}
                                        onChange={(e) => setDetails({ ...details, amount: parseInt(e.target.value) })}
                                        className="w-full accent-sakura-pink"
                                    />
                                    <span className="font-bold text-2xl w-20 text-right text-sakura-text">{details.amount}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'DIAPER':
                return (
                    <div className="grid grid-cols-3 gap-4">
                        {['PEE', 'POO', 'BOTH'].map(t => (
                            <button
                                key={t}
                                onClick={() => setDetails({ ...details, type: t })}
                                className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${details.type === t
                                    ? 'border-sakura-pink bg-sakura-pink/5 text-sakura-text'
                                    : 'border-transparent bg-gray-50 text-gray-400'
                                    }`}
                            >
                                <Droplets size={24} />
                                <span className="font-bold text-sm">{t}</span>
                            </button>
                        ))}
                    </div>
                );
            case 'SLEEP':
                return (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-500">Duration (minutes)</label>
                        <input
                            type="range"
                            min="30"
                            max="240"
                            step="15"
                            value={details.duration || 90}
                            onChange={(e) => setDetails({ ...details, duration: parseInt(e.target.value) })}
                            className="w-full accent-purple-400"
                        />
                        <div className="text-center text-lg font-bold text-sakura-text">{details.duration || 90} min</div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all ${theme === 'A' ? 'border border-white/40' : ''}`}>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={step === 'DETAILS' && !initialData ? () => setStep('TYPE') : onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        {step === 'DETAILS' && !initialData ? '←' : <X size={20} />}
                    </button>
                    <h3 className="font-display font-bold text-lg text-sakura-text">
                        {step === 'TYPE' ? '新建记录' : (initialData ? '编辑记录' : selectedType)}
                    </h3>
                    <div className="w-8">
                        {/* Delete Button for Edit Mode */}
                        {step === 'DETAILS' && initialData && (
                            <button
                                onClick={handleDelete}
                                className={`p-2 -mr-2 rounded-full transition-colors ${showDeleteConfirm
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'text-red-400 hover:text-red-500 hover:bg-red-50'
                                    }`}
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}
                    {step === 'TYPE' ? (
                        <div className="grid grid-cols-3 gap-4">
                            {RECORD_TYPES.map((t) => (
                                <button
                                    key={t.type}
                                    onClick={() => handleTypeSelect(t.type)}
                                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-sakura-pink/10 transition-colors group"
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${t.bg} ${t.color} group-hover:scale-110 transition-transform`}>
                                        <t.icon size={24} />
                                    </div>
                                    <span className="font-medium text-sm text-gray-600">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-slide-up">
                            {renderForm()}

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full mt-8 py-4 bg-sakura-pink text-white rounded-xl font-bold text-lg shadow-lg shadow-sakura-pink/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? '保存中...' : <><Check /> 保存记录</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
