import { Milk, Baby, Moon, ChevronRight, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BabyService } from '../../services/api';
// import type { BabyRecord } from '../../types';

// const records = [ ... ];

interface RecentRecordsLinesProps {
    onRecordClick?: (record: any) => void;
}

export const RecentRecordsLines = ({ onRecordClick }: RecentRecordsLinesProps) => {
    const { theme } = useTheme();
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecords = async () => {
            const data = await BabyService.getRecords('u-sakura-001');
            const mapped = data.map(r => {
                let icon = Activity;
                let color = 'text-gray-500';
                let bg = 'bg-gray-100';
                let value = '';
                let detail = '';

                if (r.type === 'FEED') {
                    icon = Milk;
                    color = 'text-blue-500';
                    bg = 'bg-blue-100';
                    value = `${(r.details as any).amount} ml`;
                    detail = (r.details as any).subtype;
                } else if (r.type === 'DIAPER') {
                    icon = Baby;
                    color = 'text-orange-500';
                    bg = 'bg-orange-100';
                    value = (r.details as any).type;
                } else if (r.type === 'SLEEP') {
                    icon = Moon;
                    color = 'text-purple-500';
                    bg = 'bg-purple-100';
                    value = 'Sleeping'; // Calc duration
                    detail = 'Nap';
                }

                return {
                    id: r.id,
                    type: r.type,
                    time: new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value,
                    detail,
                    icon,
                    color,
                    bg,
                    originalRecord: r
                };
            });
            setRecords(mapped);
        };
        fetchRecords();
    }, []);

    return (
        <div className="px-6 mt-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-sakura-text">Recent Activity</h3>
                <button className="text-xs font-semibold text-sakura-pink hover:text-sakura-text transition-colors">
                    See All
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {records.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onRecordClick?.(item.originalRecord)}
                        className={`flex items-center p-3 transition-all cursor-pointer active:scale-98 ${theme === 'A'
                            ? 'glass-panel rounded-2xl hover:bg-white/60'
                            : 'bg-white rounded-xl border border-gray-100 shadow-sm'
                            }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${theme === 'A' ? 'bg-white/60' : item.bg
                            }`}>
                            <item.icon size={20} className={item.color} />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-sakura-text capitalize">{item.type.toLowerCase()}</span>
                                <span className="text-sm font-bold text-sakura-text">{item.value}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                                <span className="text-xs text-sakura-text/50">{item.time}</span>
                                {item.detail && <span className="text-xs text-sakura-text/50">{item.detail}</span>}
                            </div>
                        </div>

                        <ChevronRight size={16} className="text-sakura-text/20 ml-2" />
                    </div>
                ))}
            </div>
        </div>
    );
};
