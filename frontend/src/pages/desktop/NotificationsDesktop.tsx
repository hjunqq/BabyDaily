import { List } from 'devextreme-react/list';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { BabyService } from '../../services/api';
import type { NotificationItem } from '../../types';

export const NotificationsDesktop = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await BabyService.getNotifications();
        setItems(data);
      } catch (err: any) {
        setError(err?.message || '获取通知失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    const updated = await BabyService.markNotificationRead(item.id);
    setItems(prev => prev.map(row => row.id === updated.id ? updated : row));
  };

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
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title">通知</h2>
      <div className="bd-card">
        <List
          dataSource={items}
          noDataText="暂无通知"
          itemRender={(item: NotificationItem) => (
            <div
              style={{ padding: '10px 0', borderBottom: '1px solid #E8DCD6', cursor: 'pointer' }}
              onClick={() => handleRead(item)}
            >
              <div style={{ fontWeight: item.isRead ? 500 : 700 }}>{item.title}</div>
              {item.content && <div style={{ fontSize: 12, color: '#6b524b' }}>{item.content}</div>}
              <div style={{ fontSize: 12, color: '#6b524b' }}>{new Date(item.createdAt).toLocaleString('zh-CN')}</div>
            </div>
          )}
        />
      </div>
    </div>
  );
};
