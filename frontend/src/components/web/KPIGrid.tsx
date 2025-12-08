import { useTheme } from '../../contexts/ThemeContext';
import { Milk, Moon, Baby, Info } from 'lucide-react';

interface KPIProps {
    title: string;
    value: React.ReactNode;
    sub: string;
    icon: React.ReactNode;
}

const KPICard = ({ title, value, sub, icon }: KPIProps) => {
    const { theme } = useTheme();
    return (
        <div className={`p-6 flex flex-col justify-between h-40 transition-all ${theme === 'A'
                ? 'glass-panel rounded-2xl'
                : 'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md'
            }`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm font-semibold text-sakura-text/60 mb-1">{title}</div>
                    <div className="text-3xl font-display font-bold text-sakura-text">{value}</div>
                </div>
                <div className={`p-2 rounded-xl ${theme === 'A' ? 'bg-white/40' : 'bg-sakura-bg'}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-sakura-text/50">
                <Info size={12} />
                {sub}
            </div>
        </div>
    );
};

interface Props {
    milkMl: number;
    diaperWet: number;
    diaperSoiled: number;
    sleepMinutes: number;
    lastFeedTime?: string;
}

export const KPIGrid = ({ milkMl, diaperWet, diaperSoiled, sleepMinutes, lastFeedTime }: Props) => {
    const sleepHours = Math.floor(sleepMinutes / 60);
    const sleepMins = sleepMinutes % 60;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <KPICard
                title="今日奶量"
                value={<span>{milkMl} <span className="text-lg">ml</span></span>}
                sub={`目标 800ml · 上次 ${lastFeedTime || '--'}`}
                icon={<Milk className="text-sakura-pink" />}
            />
            <KPICard
                title="睡眠时长"
                value={`${sleepHours}h ${sleepMins}m`}
                sub="夜间 6h · 小睡 2h 30m"
                icon={<Moon className="text-purple-400" />}
            />
            <KPICard
                title="尿布更换"
                value={`${diaperWet + diaperSoiled} 次`}
                sub={`湿 ${diaperWet} · 脏 ${diaperSoiled}`}
                icon={<Baby className="text-orange-400" />}
            />
        </div>
    );
};
