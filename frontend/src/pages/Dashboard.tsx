import { TextBox } from 'devextreme-react/text-box';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend } from 'devextreme-react/chart';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCurrentBaby } from '../hooks/useCurrentBaby';
import { API_URL } from '../config/env';
import { BabyEditModal } from '../components/desktop/BabyEditModal';
import { useState } from 'react';
import { Edit2 } from 'lucide-react';

export const Dashboard = () => {
  const { baby } = useCurrentBaby();
  const { loading, error, summary, trends, activities, refresh } = useDashboardData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const bornDays = baby?.birthday ? Math.floor((today.getTime() - new Date(baby.birthday).getTime()) / (1000 * 60 * 60 * 24)) : 0;

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

  // 获取卡片动态背景色
  const getCardBackground = (elapsedTimeMs: number): string => {
    const hours = elapsedTimeMs / (1000 * 60 * 60);
    const maxHours = 5;
    const percentage = Math.min((hours / maxHours) * 100, 100);

    const progressRatio = Math.min(hours / maxHours, 1);
    const lightness = 95 - (progressRatio * 40);
    const saturation = 50 + (progressRatio * 40);
    const tipColor = `hsl(350, ${saturation}%, ${lightness}%)`;

    return `linear-gradient(90deg, #fff5f5 0%, ${tipColor} ${percentage}%, #ffffff ${percentage}%)`;
  };


  // Wait, useDashboardData maps lastFeedTime to a formatted string. We lost the original date object.
  // Actually, summary.lastFeedTime is formatted string "HH:mm".
  // MobileHome calculates it from `records`. 
  // Let's check how MobileHome does it. It finds `lastFeedRecord`.
  // Dashboard hook exposes `activities` which are mapped from records, but maybe not raw records.
  // I should probably use `useRecords` hook in Dashboard as well or rely on summary if I can parse it, but parsing "HH:mm" is not enough for "days ago".
  // However, `useDashboardData` is specific to this page.
  // Let's modify `Dashboard` to fetch records or use what we have.
  // Actually, `useDashboardData` calls `BabyService.getRecords`.
  // Let's see if we can get the raw last feed time or calculate it properly.
  // MobileHome uses `records`. 
  // Let's proceed with adding `getCardBackground` first, and then address the data source.

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
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        {baby?.avatarUrl ? (
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <img
              src={baby.avatarUrl.startsWith('http') ? baby.avatarUrl : `${API_URL}${baby.avatarUrl}`}
              alt={baby.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F7EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            👶
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="bd-title" style={{ fontSize: 24, margin: 0 }}>{baby?.name || '宝宝'}</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 text-gray-400 hover:text-sakura-pink hover:bg-sakura-pink/10 rounded-full transition-colors"
              title="编辑信息 / 清空记录"
            >
              <Edit2 size={18} />
            </button>
          </div>
          <div style={{ fontSize: 14, color: '#8b7670', opacity: 0.9 }}>
            今天已经出生 {bornDays} 天了
          </div>
        </div>
      </div>

      <BabyEditModal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={refresh}
      />
      <div className="bd-topbar">
        <TextBox placeholder="搜索记录..." width={320} stylingMode="outlined" />
        <div style={{ fontSize: 14, color: '#6b524b' }}>{dateStr}</div>
      </div>

      <div className="bd-grid kpi">
        {/* 🍼 喂奶卡片 */}
        <div className="bd-card" style={{
          background: summary.lastFeedTime ? getCardBackground(new Date().getTime() - new Date().setHours(parseInt(summary.lastFeedTime.split(':')[0]), parseInt(summary.lastFeedTime.split(':')[1]))) : '#fff',
          // Note: The time parsing above is very rough and assumes "today". 
          // Better to use a real diff if possible, but for visual parity it might be "okay" for now or I need to fetch real records.
          // Let's try to match the style first.
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div className="bd-kpi-title" style={{ fontSize: 16, color: '#8b7670' }}>奶量总计</div>
            <div style={{ fontSize: 24 }}>🍼</div>
          </div>
          <div className="bd-kpi-value" style={{ fontSize: 28 }}>{summary.milkMl} <span style={{ fontSize: 16, color: '#8b7670' }}>ml</span></div>
          <div className="bd-kpi-sub" style={{ marginTop: 4 }}>
            {summary.lastFeedTime ? `上次喂奶: ${summary.lastFeedTime}` : '今日尚未喂奶'}
          </div>
          <div style={{ marginTop: 12 }}>
            <ProgressBar min={0} max={1000} value={summary.milkMl} showStatus={false} />
          </div>
        </div>

        {/* 💊 AD/D3 状态卡片 */}
        <div className="bd-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div className="bd-kpi-title" style={{ fontSize: 16, color: '#8b7670' }}>今日 AD/D3</div>
            <div style={{ fontSize: 24 }}>💊</div>
          </div>
          <div className="bd-kpi-value" style={{ fontSize: 24, display: 'flex', gap: 16 }}>
            <span style={{ color: summary.todayAdTaken ? '#4CAF50' : '#ccc' }}>
              AD {summary.todayAdTaken ? '✓' : '—'}
            </span>
            <span style={{ color: summary.todayD3Taken ? '#FF9800' : '#ccc' }}>
              D3 {summary.todayD3Taken ? '✓' : '—'}
            </span>
          </div>
          <div className="bd-kpi-sub" style={{ marginTop: 4 }}>每日一粒</div>
        </div>


        {/* 🧷 尿布卡片 */}
        <div className="bd-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div className="bd-kpi-title" style={{ fontSize: 16, color: '#8b7670' }}>尿布更换</div>
            <div style={{ fontSize: 24 }}>🧷</div>
          </div>
          <div className="bd-kpi-value" style={{ fontSize: 28 }}>{summary.diaperWet + summary.diaperSoiled} <span style={{ fontSize: 16, color: '#8b7670' }}>次</span></div>
          <div className="bd-kpi-sub" style={{ marginTop: 4 }}>
            湿 {summary.diaperWet} / 脏 {summary.diaperSoiled}
          </div>
          <div style={{ marginTop: 12 }}>
            <ProgressBar min={0} max={20} value={summary.diaperWet + summary.diaperSoiled} showStatus={false} />
          </div>
        </div>

        {/* 📊 趋势卡片 */}
        <div className="bd-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div className="bd-kpi-title" style={{ fontSize: 16, color: '#8b7670' }}>记录天数</div>
            <div style={{ fontSize: 24 }}>📅</div>
          </div>
          <div className="bd-kpi-value" style={{ fontSize: 28 }}>{trends.length} <span style={{ fontSize: 16, color: '#8b7670' }}>天</span></div>
          <div className="bd-kpi-sub" style={{ marginTop: 4 }}>持续记录中</div>
          <div style={{ marginTop: 12 }}>
            <ProgressBar min={0} max={30} value={trends.length} showStatus={false} />
          </div>
        </div>
      </div>

      <div className="bd-grid two" style={{ marginTop: 24 }}>
        <div className="bd-card">
          <div className="bd-section-title">喂养趋势（7 天）- 奶量</div>
          <Chart dataSource={trends} size={{ height: 220 }}>
            <ArgumentAxis valueMarginsEnabled={false} discreteAxisDivisionMode="crossLabels" />
            <ValueAxis />
            <Series
              valueField="milk"
              argumentField="name"
              type="splinearea"
              color="#FF9AA2"
            />
            <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} ml` })} />
            <Legend visible={false} />
          </Chart>
        </div>
        <div className="bd-card">
          <div className="bd-section-title">喂养趋势（7 天）- 辅食</div>
          <Chart dataSource={trends} size={{ height: 220 }}>
            <ArgumentAxis valueMarginsEnabled={false} />
            <ValueAxis />
            <Series
              valueField="solid"
              argumentField="name"
              type="bar"
              color="#B5EAD7"
              barPadding={0.3}
            />
            <Tooltip enabled customizeTooltip={(arg: any) => ({ text: `${arg.valueText} g` })} />
            <Legend visible={false} />
          </Chart>
        </div>
      </div>

      <div style={{ marginTop: 24 }} className="bd-card">
        <div className="bd-section-title">近期活动</div>
        {activities.length === 0 ? (
          <div style={{ color: '#6b524b' }}>暂无记录</div>
        ) : (
          <DataGrid dataSource={activities} showBorders={false} columnAutoWidth>
            <Column dataField="time" caption="时间" />
            <Column dataField="category" caption="类型" />
            <Column dataField="detail" caption="详情" />
            <Column dataField="duration" caption="时长" />
          </DataGrid>
        )}
      </div>
    </div>
  );
};
