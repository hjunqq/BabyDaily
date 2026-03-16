import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend, ZoomAndPan, ScrollBar } from 'devextreme-react/chart';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useMemo, useState } from 'react';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { BabyService } from '../../services/api';

const PERIOD_OPTIONS = [7, 14, 30, 60] as const;

export const StatisticsDesktop = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const [trendData, setTrendData] = useState<{ day: string; milk: number; solid: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [period, setPeriod] = useState<number>(7);
  const [visualRange, setVisualRange] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      if (!baby?.id) return;
      try {
        setLoading(true);
        const data = await BabyService.getTrends(baby.id, period);
        const mapped = Array.isArray(data)
          ? data.map((item: any) => ({
            day: item.date?.slice(5) || '',
            milk: item.milkMl ?? 0,
            solid: item.solidG ?? 0,
          }))
          : [];
        setTrendData(mapped);

        if (mapped.length > 0) {
          const end = mapped[mapped.length - 1].day;
          const start = mapped[Math.max(0, mapped.length - 7)].day;
          setVisualRange({ startValue: start, endValue: end });
        }
      } catch (err: any) {
        setError(err?.message || '加载趋势失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [baby?.id, period]);

  const kpi = useMemo(() => {
    const milkDays = trendData.filter(d => d.milk > 0);
    const milkValues = milkDays.map(d => d.milk);
    return {
      avgMilk: milkDays.length > 0 ? Math.round(milkValues.reduce((a, b) => a + b, 0) / milkDays.length) : 0,
      maxMilk: milkValues.length > 0 ? Math.max(...milkValues) : 0,
      minMilk: milkValues.length > 0 ? Math.min(...milkValues) : 0,
      recordedDays: milkDays.length,
    };
  }, [trendData]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="bd-title" style={{ margin: 0 }}>趋势统计</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: period === p ? '2px solid var(--rose)' : '2px solid var(--line)',
                background: period === p ? 'var(--rose)' : '#fff',
                color: period === p ? '#fff' : 'var(--cocoa)',
              }}
            >{p} 天</button>
          ))}
        </div>
      </div>

      <div className="bd-grid kpi" style={{ marginBottom: 20 }}>
        <div className="bd-card">
          <div className="bd-kpi-title">日均奶量</div>
          <div className="bd-kpi-value">{kpi.avgMilk} <span style={{ fontSize: 16, color: '#8b7670' }}>ml</span></div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">最高单日</div>
          <div className="bd-kpi-value">{kpi.maxMilk} <span style={{ fontSize: 16, color: '#8b7670' }}>ml</span></div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">最低单日</div>
          <div className="bd-kpi-value">{kpi.minMilk} <span style={{ fontSize: 16, color: '#8b7670' }}>ml</span></div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">有效天数</div>
          <div className="bd-kpi-value">{kpi.recordedDays} <span style={{ fontSize: 16, color: '#8b7670' }}>天</span></div>
        </div>
      </div>

      {trendData.length === 0 ? (
        <div className="bd-card" style={{ textAlign: 'center', padding: 40, color: '#8b7670' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p>暂无趋势数据，开始记录后即可查看统计</p>
        </div>
      ) : (
        <div className="bd-grid two" style={{ marginTop: 16 }}>
          <div className="bd-card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>奶量趋势</div>
            <Chart dataSource={trendData} size={{ height: 260 }}>
              <ArgumentAxis
                visualRange={visualRange}
                onVisualRangeChange={setVisualRange}
                valueMarginsEnabled={false}
                discreteAxisDivisionMode="crossLabels"
              />
              <ValueAxis />
              <Series valueField="milk" argumentField="day" type="splinearea" color="#FF9AA2" />
              <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} ml` })} />
              <Legend visible={false} />
              <ZoomAndPan argumentAxis="both" />
              <ScrollBar visible={true} />
            </Chart>
          </div>
          <div className="bd-card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>辅食趋势</div>
            <Chart dataSource={trendData} size={{ height: 260 }}>
              <ArgumentAxis
                visualRange={visualRange}
                onVisualRangeChange={setVisualRange}
                valueMarginsEnabled={false}
              />
              <ValueAxis />
              <Series valueField="solid" argumentField="day" type="bar" color="#B5EAD7" barPadding={0.3} />
              <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} g` })} />
              <Legend visible={false} />
              <ZoomAndPan argumentAxis="both" />
              <ScrollBar visible={true} />
            </Chart>
          </div>
        </div>
      )}
    </div>
  );
};
