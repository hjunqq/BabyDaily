import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';

export const BabyProfileDesktop = () => {
  const { baby, loading, error } = useCurrentBaby();

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

  if (error || !baby) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error || '未找到宝宝信息'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title">宝宝档案</h2>
      <div className="bd-card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, maxWidth: 520 }}>
        <div style={{ width: 120, height: 120, borderRadius: 24, background: '#F7EFEB' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{baby.name}</div>
          <div style={{ marginTop: 6 }}>生日：{new Date(baby.birthday).toLocaleDateString('zh-CN')}</div>
          <div>性别：{baby.gender === 'FEMALE' ? '女' : '男'}</div>
        </div>
      </div>
    </div>
  );
};
