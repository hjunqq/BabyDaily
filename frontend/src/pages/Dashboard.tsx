import { TextBox } from 'devextreme-react/text-box';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Chart, Series, ArgumentAxis, ValueAxis, Tooltip, Legend } from 'devextreme-react/chart';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import { useDashboardData } from '../hooks/useDashboardData';

export const Dashboard = () => {
  const { loading, error, summary, trends, activities, refresh } = useDashboardData();

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
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 className="bd-title">今日总览</h2>
        <p className="bd-subtitle">查看宝宝今日的喂养、睡眠与尿布记录</p>
      </div>
      <div className="bd-topbar">
        <TextBox placeholder="搜索记录..." width={320} stylingMode="outlined" />
        <div style={{ fontSize: 14, color: '#6b524b' }}>今日 · 2024/06/12</div>
      </div>

      <div className="bd-grid kpi">
        <div className="bd-card">
          <div className="bd-kpi-title">奶量总计</div>
          <div className="bd-kpi-value">{summary.milkMl} ml</div>
          <div className="bd-kpi-sub">最后喂奶：{summary.lastFeedTime || '--'}</div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar min={0} max={1000} value={summary.milkMl} showStatus={false} />
          </div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">睡眠</div>
          <div className="bd-kpi-value">{Math.floor(summary.sleepMinutes / 60)}h {summary.sleepMinutes % 60}m</div>
          <div className="bd-kpi-sub">夜间与小睡合计</div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar min={0} max={720} value={summary.sleepMinutes} showStatus={false} />
          </div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">尿布</div>
          <div className="bd-kpi-value">{summary.diaperWet + summary.diaperSoiled} 次</div>
          <div className="bd-kpi-sub">湿{summary.diaperWet} / 脏{summary.diaperSoiled}</div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar min={0} max={20} value={summary.diaperWet + summary.diaperSoiled} showStatus={false} />
          </div>
        </div>
        <div className="bd-card">
          <div className="bd-kpi-title">趋势概览</div>
          <div className="bd-kpi-value">{trends.length} 天</div>
          <div className="bd-kpi-sub">喂养与辅食</div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar min={0} max={7} value={trends.length} showStatus={false} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }} className="bd-card">
        <div className="bd-section-title">喂养趋势（7 天）</div>
        <Chart dataSource={trends} size={{ height: 220 }}>
          <ArgumentAxis />
          <ValueAxis />
          <Series valueField="milk" argumentField="name" name="奶量 (ml)" type="line" color="#F3B6C2" />
          <Series valueField="solid" argumentField="name" name="辅食 (g)" type="line" color="#BFD9C6" />
          <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          <Tooltip enabled />
        </Chart>
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
