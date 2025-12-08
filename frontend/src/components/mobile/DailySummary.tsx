import { Droplets, Clock, Baby } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BabyService } from '../../services/api';
// import type { BabyRecord } from '../../types';

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
        diaper: 0,
        sleep: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            const records = await BabyService.getRecords('u-sakura-001');
            // Simple mock aggregation
            const milk = records
                .filter(r => r.type === 'FEED')
                .reduce((acc, curr) => acc + (curr.details as any).amount || 0, 0);

            const diaper = records.filter(r => r.type === 'DIAPER').length;

            // Mock sleep duration calculation (just count hours for demo)
            const sleep = records
                .filter(r => r.type === 'SLEEP')
                .length * 1.5; // Mock 1.5h per sleep

            setSummary({ milk, diaper, sleep });
        };
        fetchData();
    }, []);

    return (
        <div className="w-full overflow-x-auto px-6 pb-4 pt-2 -mx-0 hide-scrollbar flex gap-3">
            <SummaryCard
                title="Milk"
                value={`${summary.milk} ml`}
                sub="Target: 800ml"
                icon={<Droplets size={16} className="text-blue-400" />}
                color_a="bg-blue-50/30"
            />
            <SummaryCard
                title="Diapers"
                value={`${summary.diaper} Times`}
                sub="3 Wet · 2 Dirty"
                icon={<Baby size={16} className="text-orange-400" />}
                color_a="bg-orange-50/30"
            />
            <SummaryCard
                title="Sleep"
                value={`${summary.sleep}h`}
                sub="2 Naps"
                icon={<Clock size={16} className="text-purple-400" />}
                color_a="bg-purple-50/30"
            />
            {/* Spacer for right padding in scroll */}
            <div className="w-2 flex-shrink-0" />
        </div>
    );
};
