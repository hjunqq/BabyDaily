import { Button } from 'devextreme-react/button';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { BabyService } from '../services/api';
import { useCurrentBaby } from '../hooks/useCurrentBaby';
import { useRecords } from '../hooks/useRecords';

const buildSummary = (summary: any) => {
  const sleepMinutes = summary.sleep_minutes ?? 0;
  return [
    { title: '奶量', value: `${summary.milk_ml ?? 0} ml`, detail: '今日累计', progress: summary.milk_ml ?? 0, max: 1000 },
    { title: '尿布', value: `${(summary.diaper_wet ?? 0) + (summary.diaper_soiled ?? 0)} 次`, detail: `湿${summary.diaper_wet ?? 0} / 脏${summary.diaper_soiled ?? 0}`, progress: (summary.diaper_wet ?? 0) + (summary.diaper_soiled ?? 0), max: 20 },
    { title: '睡眠', value: `${Math.floor(sleepMinutes / 60)}h ${sleepMinutes % 60}m`, detail: '今日合计', progress: sleepMinutes, max: 720 },
  ];
};

export const MobileHome = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const { records, loading: recordsLoading, error: recordsError } = useRecords(baby?.id || null, 5, 0);
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryError, setSummaryError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      if (!baby?.id) return;
      try {
        const data = await BabyService.getSummary(baby.id, 1);
        setSummary(data);
        setSummaryError(undefined);
      } catch (err: any) {
        setSummaryError(err?.message || '获取统计失败');
      }
    };
    load();
  }, [baby?.id]);

  if (babyLoading || recordsLoading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (babyError || recordsError || summaryError) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{babyError || recordsError || summaryError}</p>
        </div>
      </div>
    );
  }

  const summaryCards = summary ? buildSummary(summary) : [];

  return (
    <div>
      <div className="bd-mobile-header">
        <div className="bd-avatar" />
        <div>
          <div style={{ fontWeight: 700 }}>{baby?.name || '宝宝'}</div>
          <div style={{ fontSize: 12, color: '#6b524b' }}>今天 · {new Date().toLocaleDateString('zh-CN')}</div>
        </div>
      </div>

      <div className="bd-summary-scroll">
        {summaryCards.map(item => (
          <div key={item.title} className="bd-summary-card">
            <div style={{ fontSize: 12, fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{item.value}</div>
            <div style={{ fontSize: 12, color: '#6b524b' }}>{item.detail}</div>
            <ProgressBar min={0} max={item.max} value={item.progress} showStatus={false} />
          </div>
        ))}
      </div>

      <div className="bd-card">
        <div className="bd-section-title">最近记录</div>
        {records.length === 0 ? (
          <div style={{ color: '#6b524b' }}>暂无记录</div>
        ) : (
          records.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 13 }}>
              <span>{new Date(item.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} {mapRecordType(item.type)}</span>
              <strong>{item.remark || '—'}</strong>
            </div>
          ))
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b524b' }}>查看全部 →</div>
      </div>

      <div className="bd-fab">
        <Button text="+ 记录" type="default" stylingMode="contained" width={120} height={44} />
      </div>
    </div>
  );
};

const mapRecordType = (type: string) => {
  switch (type) {
    case 'FEED':
      return '喂奶';
    case 'DIAPER':
      return '尿布';
    case 'SLEEP':
      return '睡眠';
    default:
      return '记录';
  }
};
