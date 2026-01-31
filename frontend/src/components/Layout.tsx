import React from 'react';
import { List } from 'devextreme-react/list';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', text: '仪表盘', path: '/' },
  { id: 'records', text: '记录', path: '/records' },
  { id: 'record', text: '新建记录', path: '/record' },
  { id: 'statistics', text: '趋势统计', path: '/statistics' },
  { id: 'ootd', text: '宝宝穿搭', path: '/ootd' },
  { id: 'profile', text: '我的', path: '/profile' },
  { id: 'settings', text: '设置', path: '/settings' },
  { id: 'notifications', text: '通知', path: '/notifications' },
  { id: 'api', text: '接口测试', path: '/api-test' },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = navItems.find(item => location.pathname.startsWith(item.path)) ?? navItems[0];

  return (
    <div className="bd-shell">
      <aside className="bd-sidebar">
        <div className="bd-logo">BabyDaily</div>
        <div style={{ marginTop: 20 }}>
          <List
            dataSource={navItems}
            keyExpr="id"
            displayExpr="text"
            selectionMode="single"
            selectedItemKeys={[active.id]}
            onItemClick={e => e.itemData && navigate(e.itemData.path)}
          />
        </div>
      </aside>
      <div className="bd-main">
        <div className="bd-page">
          {children}
        </div>
      </div>
    </div>
  );
};
