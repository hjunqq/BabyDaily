import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 0, icon: '🏠', label: '首页', path: '/' },
  { id: 1, icon: '📋', label: '记录', path: '/records' },
  { id: 2, icon: '📊', label: '统计', path: '/statistics' },
  { id: 3, icon: '☰', label: '更多', path: '#more' },
];

const moreMenuItems = [
  { icon: '➕', label: '新建记录', path: '/record' },
  { icon: '👶', label: '宝宝档案', path: '/baby' },
  { icon: '👗', label: '穿搭相册', path: '/ootd' },
  { icon: '👨‍👩‍👧', label: '家庭成员', path: '/family' },
  { icon: '⚙️', label: '设置', path: '/settings' },
];

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const getActiveIndex = () => {
    for (let i = 0; i < navItems.length - 1; i++) {
      if (location.pathname === navItems[i].path ||
        (navItems[i].path !== '/' && location.pathname.startsWith(navItems[i].path))) {
        return i;
      }
    }
    // Check if current path is in more menu
    const inMoreMenu = moreMenuItems.some(item => location.pathname.startsWith(item.path));
    if (inMoreMenu) return 3;
    return 0;
  };

  const activeIndex = getActiveIndex();

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    e.preventDefault();
    if (item.path === '#more') {
      setShowMoreMenu(!showMoreMenu);
    } else {
      setShowMoreMenu(false);
      navigate(item.path);
    }
  };

  // Close menu when clicking outside
  const handleOverlayClick = () => {
    setShowMoreMenu(false);
  };

  return (
    <div className="bd-app">
      <div className="bd-mobile-shell">
        {children}
      </div>

      {/* 底部导航栏 */}
      <nav className="bd-bottom-nav-new">
        {navItems.map((item, index) => (
          <button
            key={item.id}
            className={`bd-nav-item ${activeIndex === index ? 'active' : ''}`}
            onClick={(e) => handleNavClick(item, e)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 更多菜单弹出层 */}
      {showMoreMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 55
            }}
            onClick={handleOverlayClick}
          />
          <div className="bd-more-menu active">
            {moreMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMoreMenu(false)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
