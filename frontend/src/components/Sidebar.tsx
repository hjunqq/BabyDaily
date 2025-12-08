
import { LayoutDashboard, Baby, Activity, Settings, Leaf } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
    const { theme } = useTheme();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/web' },
        { icon: Activity, label: 'Mobile Home', path: '/mobile' },
        { icon: Leaf, label: 'Daily Log', path: '/web' },
        { icon: Baby, label: 'Wardrobe (OOTD)', path: '/ootd' },
        { icon: Settings, label: 'Settings', path: '/web' },
    ];

    return (
        <div className={`w-64 h-screen fixed left-0 top-0 p-6 flex flex-col transition-all z-50 ${theme === 'A' ? 'bg-white/40 backdrop-blur-xl border-r border-white/50' : 'bg-white border-r border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-xl bg-sakura-pink flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sakura-pink/30">
                    SB
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg text-sakura-text">Little Blossom</h1>
                    <p className="text-xs text-sakura-text/50">Tracker vNext</p>
                </div>
            </div>

            <nav className="space-y-2 flex-1">
                {menuItems.map((item, index) => {
                    // Check active if path matches exactly or if it's OOTD
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-sakura-pink text-white shadow-lg shadow-sakura-pink/30 font-bold'
                                : 'text-sakura-text/60 hover:bg-sakura-pink/10 hover:text-sakura-text'
                                }`}
                        >
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-8 left-0 w-full px-6">
                <div className={`p-4 rounded-xl ${theme === 'A' ? 'bg-white/40 border border-white/50' : 'bg-sakura-bg'}`}>
                    <div className="text-xs text-gray-500 mb-1">当前登录</div>
                    <div className="font-bold text-sm text-sakura-text">樱花妈妈</div>
                </div>
            </div>
        </div>
    );
};
