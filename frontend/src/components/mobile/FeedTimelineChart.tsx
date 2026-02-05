import { useEffect, useState } from 'react';
import { BabyService } from '../../services/api';
import type { FeedTimelineData } from '../../types';

interface FeedTimelineChartProps {
    babyId: string;
    dayStartHour?: number;
}

export const FeedTimelineChart = ({ babyId, dayStartHour = 0 }: FeedTimelineChartProps) => {
    const [data, setData] = useState<FeedTimelineData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!babyId) return;
            setLoading(true);
            try {
                const result = await BabyService.getFeedTimeline(babyId, dayStartHour);
                setData(result);
            } catch {
                // 静默处理错误
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [babyId, dayStartHour]);

    // 加载中或无数据时不显示
    if (loading || !data || data.items.length === 0) {
        return null;
    }

    const { items, totalMl } = data;

    return (
        <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '14px 16px',
            marginTop: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)'
        }}>
            {/* 标题行 - 紧凑 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
            }}>
                <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#4A342E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <span style={{
                        display: 'inline-block',
                        width: 20,
                        height: 20,
                        lineHeight: '20px',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        border: '2px solid #4A342E',
                        borderRadius: 4
                    }}>统</span>
                    今日喂奶明细
                </div>
                <div style={{
                    fontSize: 13,
                    color: '#F3B6C2',
                    fontWeight: 600
                }}>
                    共 {items.length} 次 · {totalMl}ml
                </div>
            </div>

            {/* 紧凑时间线 - 流式布局 */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8
            }}>
                {items.map((item) => {
                    // 优先使用服务器预计算的时间（Kindle兼容）
                    const timeStr = item.formattedTime || new Date(item.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                    const isBreast = item.subtype === 'BREAST';

                    return (
                        <div
                            key={item.id}
                            style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: isBreast ? '#f0f7f2' : '#fff5f7',
                                border: `1px solid ${isBreast ? '#d4e8da' : '#fce4e9'}`,
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <span style={{
                                color: '#8b7670',
                                fontFamily: 'monospace',
                                fontSize: 11
                            }}>
                                {timeStr}
                            </span>
                            <span style={{
                                fontWeight: 600,
                                color: isBreast ? '#7AB08A' : '#E89AAA'
                            }}>
                                {isBreast ? `${item.duration || 0}m` : `${item.amount}ml`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
