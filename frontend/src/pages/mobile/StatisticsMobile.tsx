import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend, ZoomAndPan, ScrollBar } from 'devextreme-react/chart';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { BabyService } from '../../services/api';

export const StatisticsMobile = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const [trendData, setTrendData] = useState<{ day: string; milk: number; solid: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  // Initial visual range (show last 7 days of data)
  const [visualRange, setVisualRange] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      if (!baby?.id) return;
      try {
        setLoading(true);
        // Load 60 days of data to allow scrolling back
        const data = await BabyService.getTrends(baby.id, 60);
        const mapped = Array.isArray(data)
          ? data.map((item: any) => ({
            day: item.date?.slice(5) || '',
            milk: item.milkMl ?? 0,
            solid: item.solidG ?? 0,
          }))
          : [];
        setTrendData(mapped);

        // Set initial visual range to last 7 entries if available
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
      <h2 className="bd-title" style={{ fontSize: 22 }}>趋势统计</h2>
      <div className="bd-card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>奶量趋势</div>
        <Chart
          dataSource={trendData}
          size={{ height: 260 }}
        >
          <ArgumentAxis
            visualRange={visualRange}
            onVisualRangeChange={setVisualRange}
            valueMarginsEnabled={false}
            discreteAxisDivisionMode="crossLabels"
          />
          <ValueAxis />
          <Series
            valueField="milk"
            argumentField="day"
            type="splinearea"
            color="#FF9AA2"
          />
          <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} ml` })} />
          <Legend visible={false} />
          <ZoomAndPan argumentAxis="both" />
          <ScrollBar visible={true} />
        </Chart>
      </div>
      <div className="bd-card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>辅食趋势</div>
        <Chart
          dataSource={trendData}
          size={{ height: 260 }}
        >
          <ArgumentAxis
            visualRange={visualRange}
            onVisualRangeChange={setVisualRange}
            valueMarginsEnabled={false}
          />
          <ValueAxis />
          <Series
            valueField="solid"
            argumentField="day"
            type="bar"
            color="#B5EAD7"
            barPadding={0.3}
          />
          <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} g` })} />
          <Legend visible={false} />
          <ZoomAndPan argumentAxis="both" />
          <ScrollBar visible={true} />
        </Chart>
      </div>
    </div>
  );
};
