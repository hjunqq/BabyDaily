import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { BabyService } from '../../services/api';
import { useEffect, useState } from 'react';
import type { User } from '../../types';

export const ProfileMobile = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await BabyService.getMe();
        setUser(data);
      } catch (err: any) {
        setError(err?.message || '获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || babyLoading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (error || babyError) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error || babyError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title" style={{ fontSize: 22 }}>个人中心</h2>
      <div className="bd-card" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 70, height: 70, borderRadius: 18, background: '#F7EFEB' }} />
        <div>
          <div style={{ fontWeight: 700 }}>{user?.nickname || '未登录用户'}</div>
          <div style={{ fontSize: 12, color: '#6b524b' }}>{user?.id || '--'}</div>
        </div>
      </div>
      <div className="bd-card">宝宝：{baby?.name || '--'}</div>
      <div className="bd-card" style={{ marginTop: 10 }}>生日：{baby?.birthday ? new Date(baby.birthday).toLocaleDateString('zh-CN') : '--'}</div>
      <div className="bd-card" style={{ marginTop: 10 }}>性别：{baby?.gender === 'FEMALE' ? '女' : '男'}</div>
    </div>
  );
};
