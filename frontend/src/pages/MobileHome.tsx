import { Baby, Droplets, Heart, Moon, Plus, Smile } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { MobileHomeSkeleton, EmptyState, ErrorState, FAB } from '../components/common';
import { RecordForm } from '../components/web/RecordForm';

type RecordItem = {
    id: string | number;
    time: string;
    type: 'FEED' | 'SLEEP' | 'DIAPER';
    title: string;
    detail: string;
};

const typeBadge = (type: RecordItem['type']) => {
    switch (type) {
        case 'FEED':
            return 'bg-sakura-pink/15 text-sakura-text';
        case 'SLEEP':
            return 'bg-purple-100 text-purple-700';
        case 'DIAPER':
            return 'bg-emerald-100 text-emerald-700';
        default:
            return 'bg-sakura-bg text-sakura-text';
    }
};

const typeIcon = (type: RecordItem['type']) => {
    switch (type) {
        case 'FEED':
            return <Droplets size={16} className="text-sakura-pink" />;
        case 'SLEEP':
            return <Moon size={16} className="text-purple-500" />;
        case 'DIAPER':
            return <Baby size={16} className="text-emerald-600" />;
        default:
            return <Smile size={16} />;
    }
};

export const MobileHome = () => {
    const { theme } = useTheme();
    const { summary, activities, loading, error, refresh } = useDashboardData();
    const [showForm, setShowForm] = useState(false);

    const summaryCards = useMemo(() => ([
        {
            title: '今日奶量',
            value: `${summary.milkMl} ml`,
            sub: '目标 800 ml',
            icon: <Droplets size={18} className="text-sakura-pink" />,
            accent: 'bg-sakura-pink/15',
        },
        {
            title: '尿布更换',
            value: `${summary.diaperWet + summary.diaperSoiled} 次`,
            sub: `湿 ${summary.diaperWet} · 脏 ${summary.diaperSoiled}`,
            icon: <Baby size={18} className="text-amber-500" />,
            accent: 'bg-amber-100',
        },
        {
            title: '睡眠时长',
            value: `${Math.floor(summary.sleepMinutes / 60)}h ${summary.sleepMinutes % 60}m`,
            sub: '夜间 + 小睡',
            icon: <Moon size={18} className="text-purple-500" />,
            accent: 'bg-purple-100',
        },
    ]), [summary]);

    const recentRecords: RecordItem[] = useMemo(() => {
        return activities.slice(0, 4).map((a) => ({
            id: a.id,
            time: a.time,
            type: a.category === '喂奶' ? 'FEED' : a.category === '睡眠' ? 'SLEEP' : 'DIAPER',
            title: a.category,
            detail: a.detail,
        }));
    }, [activities]);

    if (loading) return <MobileHomeSkeleton />;

    if (error) {
        return (
            <div className="max-w-xl mx-auto px-5 py-16">
                <ErrorState
                    type="server"
                    message={error}
                    onRetry={refresh}
                />
            </div>
        );
    }

    const hasRecords = recentRecords.length > 0;

    return (
        <div className="max-w-xl mx-auto px-5 pb-28 relative space-y-6 animate-fade-in">
            {/* 头部卡片 */}
            <div className={`mt-2 p-5 rounded-3xl ${theme === 'A'
                ? 'glass-panel'
                : 'bg-white shadow-lg shadow-sakura-text/5 border border-sakura-text/5'
                }`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sakura-pink flex items-center justify-center text-white font-display text-xl shadow-lg shadow-sakura-pink/40">
                        樱
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-sakura-text/60">2024 年 2 月 15 日 · 星期四</div>
                        <div className="text-xl font-display font-bold text-sakura-text">樱樱的今天</div>
                        <div className="text-sm text-sakura-text/60 flex items-center gap-1">
                            <Heart size={14} className="text-sakura-pink" /> 记录每个温柔瞬间
                        </div>
                    </div>
                </div>
            </div>

            {/* 今日关键总览 */}
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {summaryCards.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex-shrink-0 w-36 p-4 rounded-2xl transition-all ${theme === 'A' ? 'glass-panel' : 'bg-white shadow-sm border border-gray-100'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-sakura-text/60">{item.title}</span>
                            <span className={`p-1 rounded-lg ${item.accent}`}>{item.icon}</span>
                        </div>
                        <div className="text-xl font-bold text-sakura-text leading-snug">{item.value}</div>
                        <div className="text-[11px] text-sakura-text/60 mt-1">{item.sub}</div>
                    </div>
                ))}
                <div className="w-2 flex-shrink-0" />
            </div>

            {/* 最近记录列表 */}
            {hasRecords ? (
                <div className={`rounded-3xl p-5 space-y-4 ${theme === 'A' ? 'glass-panel' : 'bg-white shadow-sm border border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-sakura-text/70">最近记录</div>
                            <div className="text-xs text-sakura-text/50">保留最近 4 条 · 更早查看全部</div>
                        </div>
                        <button className="text-xs font-bold text-sakura-pink hover:text-sakura-text min-h-[44px] px-3 rounded-xl" aria-label="查看全部记录" onClick={() => setShowForm(true)}>
                            查看全部
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentRecords.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-sakura-bg/70 border border-sakura-text/5">
                                <div className="w-12 text-xs font-bold text-sakura-text">{item.time}</div>
                                <div className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${typeBadge(item.type)}`}>
                                    <span className="inline-flex items-center gap-1">{typeIcon(item.type)} {item.title}</span>
                                </div>
                                <div className="text-sm text-sakura-text/80 flex-1">{item.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <EmptyState
                    type="no-records"
                    action={{
                        label: '添加第一条记录',
                        onClick: () => setShowForm(true),
                    }}
                />
            )}

            {/* 主操作按钮 */}
            <FAB
                icon={<Plus size={18} />}
                label="添加记录"
                onClick={() => setShowForm(true)}
            />

            {showForm && (
                <RecordForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        refresh();
                    }}
                />
            )}
        </div>
    );
};
