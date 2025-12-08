import { Droplets, Clock, Baby } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BabyService } from '../../services/api';

interface SummaryCardProps {
    title: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    color_a: string;
}

const SummaryCard = ({ title, value, sub, icon, color_a }: SummaryCardProps) => {
    const { theme } = useTheme();

    return (
        <div className={`flex-shrink-0 w-28 p-4 flex flex-col justify-between transition-all duration-300 ${theme === 'A'
            ? `glass-panel rounded-[20px] ${color_a}`
            : 'bg-sakura-bg rounded-2xl border border-sakura-pink/10'
            }`}>
            <div className={`p-2 w-fit rounded-full ${theme === 'A' ? 'bg-white/50' : 'bg-white'}`}>
                {icon}
            </div>
            <div className="mt-2">
                <div className="text-xs text-sakura-text/60 font-semibold mb-0.5">{title}</div>
                <div className="text-lg font-bold text-sakura-text leading-tight">{value}</div>
                <div className="text-[10px] text-sakura-text/50">{sub}</div>
            </div>
        </div>
    );
};

export const DailySummary = () => {
    const [summary, setSummary] = useState({
        milk: 0,
        diaperWet: 0,
        diaperSoiled: 0,
        sleep: 0
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                await BabyService.ensureDevEnvironment();
                const babyId = BabyService.getCurrentBabyId() || 'u-sakura-001';
                const res = await BabyService.getSummary(babyId);
                setSummary({
                    milk: Math.round(res.milk_ml ?? 0),
                    diaperWet: res.diaper_wet ?? 0,
                    diaperSoiled: res.diaper_soiled ?? 0,
                    sleep: Math.round((res.sleep_minutes ?? 0) / 60),
                });
            } catch (err: any) {
                setError(err?.message || '统计数据加载失败');
            }
        };
        fetchData();
    }, []);

    return (
        <div className="w-full overflow-x-auto px-6 pb-4 pt-2 -mx-0 hide-scrollbar flex gap-3">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl min-w-[220px]">
                    {error}
                </div>
            )}
            <SummaryCard
                title="奶量"
                value={`${summary.milk} ml`}
                sub="目标：800ml"
                icon={<Droplets size={16} className="text-blue-400" />}
                color_a="bg-blue-50/30"
            />
            <SummaryCard
                title="尿布"
                value={`${summary.diaperWet + summary.diaperSoiled} 次`}
                sub={`${summary.diaperWet} 湿 · ${summary.diaperSoiled} 脏`}
                icon={<Baby size={16} className="text-orange-400" />}
                color_a="bg-orange-50/30"
            />
            <SummaryCard
                title="睡眠"
                value={`${summary.sleep}h`}
                sub="今日累计"
                icon={<Clock size={16} className="text-purple-400" />}
                color_a="bg-purple-50/30"
            />
            {/* Spacer for right padding in scroll */}
            <div className="w-2 flex-shrink-0" />
        </div>
    );
};
