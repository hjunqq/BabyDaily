import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend } from 'devextreme-react/chart';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCurrentBaby } from '../hooks/useCurrentBaby';
import { API_URL } from '../config/env';
import { BabyService } from '../services/api';
import { BabyEditModal } from '../components/desktop/BabyEditModal';
import { useMemo, useState } from 'react';
import { Edit2 } from 'lucide-react';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const getElapsed = (time?: string) => (time ? Math.max(0, Date.now() - new Date(time).getTime()) : undefined);

const formatElapsed = (elapsedMs?: number) => {
  if (elapsedMs === undefined) return '暂无记录';
  if (elapsedMs < 60_000) return '刚刚';
  const mins = Math.floor(elapsedMs / 60_000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hours < 24) return remainMins ? `${hours}小时${remainMins}分钟前` : `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
};

const getProgress = (elapsedMs: number | undefined, maxMs: number) => {
  if (elapsedMs === undefined) return 0;
  return Math.min((elapsedMs / maxMs) * 100, 100);
};

const CountdownBar = ({ label, elapsedMs, maxMs, color }: { label: string; elapsedMs?: number; maxMs: number; color: string }) => {
  const pct = getProgress(elapsedMs, maxMs);
  return (
    <div className="bd-countdown-card">
      <div className="bd-countdown-head">
        <span>{label}</span>
        <strong>{formatElapsed(elapsedMs)}</strong>
      </div>
      <div className="bd-countdown-track">
        <div className="bd-countdown-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bd-countdown-foot">{pct >= 100 ? '已超过建议周期' : `进度 ${Math.round(pct)}%`}</div>
    </div>
  );
};

const QuickActionBtn = ({ label, color, onClick }: { label: string; color: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 18px', borderRadius: 12, border: `2px solid ${color}`,
      background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
      color: '#4A342E', display: 'flex', alignItems: 'center', gap: 6,
    }}
    onMouseOver={e => (e.currentTarget.style.background = color + '20')}
    onMouseOut={e => (e.currentTarget.style.background = '#fff')}
  >
    {label}
  </button>
);

const getTypeIcon = (category: string): string => {
  if (category === '瓶喂' || category === '亲喂') return '🍼';
  if (category === '尿布') return '🧷';
  if (category === '洗澡') return '🛁';
  if (category === '维生素AD') return '💊';
  if (category === '维生素D3') return '☀️';
  if (category === '睡眠') return '💤';
  return '📝';
};

export const Dashboard = () => {
  const { baby } = useCurrentBaby();
  const { loading, error, summary, trends, activities, refresh } = useDashboardData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const bornDays = baby?.birthday ? Math.floor((today.getTime() - new Date(baby.birthday).getTime()) / DAY) : 0;

  const elapsed = useMemo(() => ({
    feed: getElapsed(summary.lastFeedTime),
    pee: getElapsed(summary.lastPeeTime || summary.lastDiaperTime),
    poo: getElapsed(summary.lastPooTime || summary.lastDiaperTime),
    bath: getElapsed(summary.lastBathTime),
  }), [summary.lastFeedTime, summary.lastPeeTime, summary.lastPooTime, summary.lastDiaperTime, summary.lastBathTime]);

  if (loading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error}</p>
          <Button text="重试" type="default" stylingMode="contained" height={40} onClick={refresh} />
        </div>
      </div>
    );
  }

  return (
    <div className="bd-home-layout">
      <section className="bd-card bd-home-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {baby?.avatarUrl ? (
            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <img
                src={baby.avatarUrl.startsWith('http') ? baby.avatarUrl : `${API_URL}${baby.avatarUrl}`}
                alt={baby.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F7EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👶</div>
          )}
          <div style={{ flex: 1 }}>
            <h2 className="bd-title" style={{ fontSize: 24, margin: 0 }}>{baby?.name || '宝宝'}</h2>
            <p style={{ margin: '6px 0 0', color: '#8b7670' }}>{dateStr} · 出生 {bornDays} 天</p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-sakura-pink hover:bg-sakura-pink/10 rounded-full transition-colors"
            title="编辑信息"
          >
            <Edit2 size={18} />
          </button>
        </div>
      </section>

      <BabyEditModal visible={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={refresh} />

      <section className="bd-grid kpi">
        <div className="bd-card">
          <div className="bd-kpi-title">今日奶量</div>
          <div className="bd-kpi-value">{summary.milkMl} <span style={{ fontSize: 16, color: '#8b7670' }}>ml</span></div>
          <div className="bd-kpi-sub">{summary.feedCount ?? 0} 次 · 上次 {formatElapsed(elapsed.feed)}</div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">尿布统计</div>
          <div className="bd-kpi-value">{summary.diaperWet + summary.diaperSoiled}<span style={{ fontSize: 16, color: '#8b7670' }}> 次</span></div>
          <div className="bd-kpi-sub">尿尿 {summary.diaperWet} / 便便 {summary.diaperSoiled}</div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">今日补剂</div>
          <div className="bd-kpi-value" style={{ fontSize: 22 }}>{summary.todayAdTaken ? 'AD ✓' : 'AD —'} / {summary.todayD3Taken ? 'D3 ✓' : 'D3 —'}</div>
          <div className="bd-kpi-sub">每日一粒</div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">连续记录</div>
          <div className="bd-kpi-value">{trends.length}<span style={{ fontSize: 16, color: '#8b7670' }}> 天</span></div>
          <div className="bd-kpi-sub">最近 7 天趋势</div>
        </div>
      </section>

      <section className="bd-home-block" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <QuickActionBtn label="🍼 记录喂奶" color="#F3B6C2" onClick={async () => {
            const amount = prompt('输入奶量 (ml)', '150');
            if (!amount || !baby?.id) return;
            await BabyService.createRecord({ type: 'FEED', babyId: baby.id, time: new Date().toISOString(), details: { subtype: 'BOTTLE', amount: parseInt(amount), unit: 'ml' } });
            refresh();
          }} />
          <QuickActionBtn label="🧷 尿尿" color="#64b5f6" onClick={async () => {
            if (!baby?.id) return;
            await BabyService.createRecord({ type: 'DIAPER', babyId: baby.id, time: new Date().toISOString(), details: { type: 'PEE' } });
            refresh();
          }} />
          <QuickActionBtn label="💩 便便" color="#ffb74d" onClick={async () => {
            if (!baby?.id) return;
            await BabyService.createRecord({ type: 'DIAPER', babyId: baby.id, time: new Date().toISOString(), details: { type: 'POO' } });
            refresh();
          }} />
          <QuickActionBtn label="🛁 洗澡" color="#4db6ac" onClick={async () => {
            if (!baby?.id) return;
            await BabyService.createRecord({ type: 'BATH', babyId: baby.id, time: new Date().toISOString(), details: { duration: 10, unit: 'min' } });
            refresh();
          }} />
          <QuickActionBtn label="💊 AD" color="#66bb6a" onClick={async () => {
            if (!baby?.id) return;
            await BabyService.createRecord({ type: 'VITA_AD', babyId: baby.id, time: new Date().toISOString(), details: { amount: 1, unit: '粒' } });
            refresh();
          }} />
          <QuickActionBtn label="☀️ D3" color="#ffa726" onClick={async () => {
            if (!baby?.id) return;
            await BabyService.createRecord({ type: 'VITA_D3', babyId: baby.id, time: new Date().toISOString(), details: { amount: 1, unit: '粒' } });
            refresh();
          }} />
        </div>
      </section>

      <section className="bd-home-block">
        <h3 className="bd-section-title">护理倒计时</h3>
        <div className="bd-countdown-grid">
          <CountdownBar label="尿尿" elapsedMs={elapsed.pee} maxMs={24 * HOUR} color="#64b5f6" />
          <CountdownBar label="便便" elapsedMs={elapsed.poo} maxMs={7 * DAY} color="#ffb74d" />
          <CountdownBar label="洗澡" elapsedMs={elapsed.bath} maxMs={5 * DAY} color="#4db6ac" />
        </div>
      </section>

      <section className="bd-grid two bd-home-block">
        <div className="bd-card">
          <div className="bd-section-title">喂养趋势（7 天）- 奶量</div>
          <Chart dataSource={trends} size={{ height: 220 }}>
            <ArgumentAxis valueMarginsEnabled={false} discreteAxisDivisionMode="crossLabels" />
            <ValueAxis />
            <Series valueField="milk" argumentField="name" type="splinearea" color="#FF9AA2" />
            <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} ml` })} />
            <Legend visible={false} />
          </Chart>
        </div>
        <div className="bd-card">
          <div className="bd-section-title">喂养趋势（7 天）- 辅食</div>
          <Chart dataSource={trends} size={{ height: 220 }}>
            <ArgumentAxis valueMarginsEnabled={false} />
            <ValueAxis />
            <Series valueField="solid" argumentField="name" type="bar" color="#B5EAD7" barPadding={0.3} />
            <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} g` })} />
            <Legend visible={false} />
          </Chart>
        </div>
      </section>

      <section className="bd-card bd-home-block">
        <div className="bd-section-title">近期活动</div>
        {activities.length === 0 ? (
          <div style={{ color: '#6b524b' }}>暂无记录</div>
        ) : (
          <DataGrid dataSource={activities} showBorders={false} columnAutoWidth rowAlternationEnabled>
            <Column dataField="time" caption="时间" width={90} />
            <Column dataField="category" caption="类型" cellRender={(cellData: any) => (
              <span>{getTypeIcon(cellData.value)} {cellData.value}</span>
            )} />
            <Column dataField="detail" caption="详情" />
            <Column dataField="duration" caption="时长" width={80} />
          </DataGrid>
        )}
      </section>
    </div>
  );
};
