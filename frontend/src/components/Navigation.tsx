import { LayoutDashboard, Smartphone, Camera, Beaker } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

type Variant = 'sidebar' | 'bottom';

type NavigationProps = {
    variant: Variant;
};

const navItems = [
    { icon: LayoutDashboard, label: '仪表盘', path: '/web' },
    { icon: Smartphone, label: '移动首页', path: '/mobile' },
    { icon: Camera, label: '穿搭记录', path: '/ootd' },
    { icon: Beaker, label: 'API 测试', path: '/test' },
];

export const Navigation = ({ variant }: NavigationProps) => {
    const { theme } = useTheme();
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/web' && location.pathname === '/') return true;
        return location.pathname.startsWith(path);
    };

    if (variant === 'sidebar') {
        return (
            <aside className={`w-64 h-screen fixed left-0 top-0 p-6 flex flex-col transition-all z-50 ${theme === 'A' ? 'bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-lg shadow-sakura-pink/10' : 'bg-white border-r border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-xl bg-sakura-pink flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sakura-pink/30">
                        SB
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg text-sakura-text">Little Blossom</h1>
                        <p className="text-xs text-sakura-text/50">宝宝日常 · 追踪面板</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    active
                                        ? 'bg-sakura-pink text-white shadow-lg shadow-sakura-pink/30 font-bold'
                                        : 'text-sakura-text/70 hover:bg-sakura-pink/10 hover:text-sakura-text'
                                }`}
                            >
                                <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                                <span className={active ? 'font-bold' : 'font-medium'}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-6 p-4 rounded-xl bg-sakura-bg text-sakura-text">
                    <div className="text-xs text-gray-500 mb-1">当前登录</div>
                    <div className="font-bold text-sm">樱花妈妈</div>
                </div>
            </aside>
        );
    }

    // Bottom navigation for mobile
    return (
        <nav className={`fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 ${theme === 'A' ? 'bg-white/80 backdrop-blur-lg border-t border-white/60' : 'bg-white border-t border-gray-100 shadow-lg shadow-sakura-text/5'}`}>
            <div className="flex items-center justify-between gap-2">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2 transition-all ${
                                active
                                    ? 'bg-sakura-pink text-white shadow-lg shadow-sakura-pink/30'
                                    : 'text-sakura-text/70 hover:bg-sakura-bg'
                            }`}
                        >
                            <item.icon size={18} strokeWidth={active ? 2.6 : 2} />
                            <span className="text-xs font-semibold">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
