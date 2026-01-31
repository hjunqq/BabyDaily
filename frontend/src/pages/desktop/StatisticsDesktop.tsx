import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend } from 'devextreme-react/chart';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { BabyService } from '../../services/api';

export const StatisticsDesktop = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const [trendData, setTrendData] = useState<{ day: string; milk: number; solid: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      if (!baby?.id) return;
      try {
        setLoading(true);
        const data = await BabyService.getTrends(baby.id, 7);
        const mapped = Array.isArray(data)
          ? data.map((item: any) => ({
            day: item.date?.slice(5) || '',
            milk: item.milkMl ?? 0,
            solid: item.solidG ?? 0,
          }))
          : [];
        setTrendData(mapped);
      } catch (err: any) {
        setError(err?.message || '加载趋势失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [baby?.id]);

  if (babyLoading || loading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (babyError || error) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{babyError || error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title">趋势统计</h2>
      <div className="bd-grid two" style={{ marginTop: 16 }}>
        <div className="bd-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>奶量趋势</div>
          <Chart dataSource={trendData} size={{ height: 220 }}>
            <ArgumentAxis />
            <ValueAxis />
            <Series valueField="milk" argumentField="day" type="line" color="#F3B6C2" name="奶量" />
            <Tooltip enabled />
            <Legend visible={false} />
          </Chart>
        </div>
        <div className="bd-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>辅食趋势</div>
          <Chart dataSource={trendData} size={{ height: 220 }}>
            <ArgumentAxis />
            <ValueAxis />
            <Series valueField="solid" argumentField="day" type="bar" color="#BFD9C6" name="辅食" />
            <Tooltip enabled />
            <Legend visible={false} />
          </Chart>
        </div>
      </div>
    </div>
  );
};
