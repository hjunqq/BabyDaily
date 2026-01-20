import React from 'react';
import { Tabs } from 'devextreme-react/tabs';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 0, text: '首页', path: '/mobile' },
  { id: 1, text: '记录', path: '/mobile/records' },
  { id: 2, text: '统计', path: '/mobile/statistics' },
  { id: 3, text: '穿搭', path: '/mobile/ootd' },
  { id: 4, text: '我的', path: '/mobile/profile' },
];

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeIndex = Math.max(0, navItems.findIndex(item => location.pathname.startsWith(item.path)));

  return (
    <div className="bd-app">
      <div className="bd-mobile-shell">
        {children}
      </div>
      <div className="bd-bottom-nav">
        <Tabs
          dataSource={navItems}
          selectedIndex={activeIndex}
          onSelectionChanged={e => navigate(e.addedItems[0].path)}
        />
      </div>
    </div>
  );
};
