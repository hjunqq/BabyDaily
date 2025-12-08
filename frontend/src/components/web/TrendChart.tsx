import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
    data: { name: string; milk: number; solid: number }[];
}

export const TrendChart = ({ data }: Props) => {
    const { theme } = useTheme();

    return (
        <div className={`p-6 mb-8 transition-all ${theme === 'A'
            ? 'glass-panel rounded-2xl'
            : 'bg-white rounded-2xl shadow-sm border border-gray-100'
            }`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display font-bold text-lg text-sakura-text">喂养趋势（近 7 天）</h3>
                    <p className="text-sm text-sakura-text/50">按日查看奶量与辅食变化</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-sakura-text/70">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sakura-pink"></span> 奶量 (ml)</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-200"></span> 辅食 (g)</span>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                                    <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFB7C5" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#FFB7C5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSolid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9AE6B4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#9AE6B4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'A' ? 'rgba(255,255,255,0.5)' : '#f1e7eb'} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#5A3A2E', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#5A3A2E', fontSize: 12 }}
                            unit="ml"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="milk"
                            stroke="#FFB7C5"
                            fillOpacity={1}
                            fill="url(#colorMilk)"
                            strokeWidth={3}
                        />
                        <Area
                            type="monotone"
                            dataKey="solid"
                            stroke="#48BB78"
                            fillOpacity={1}
                            fill="url(#colorSolid)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
