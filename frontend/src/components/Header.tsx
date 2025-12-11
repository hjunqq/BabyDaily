import { Search, Bell, HelpCircle, ToggleLeft, ToggleRight, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BabyService } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        BabyService.logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="flex items-center justify-between py-4 px-8 mb-8">
            {/* Search Bar - Hidden on mobile, visible on desktop */}
            <div className={`
        hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl w-96 transition-all
        ${theme === 'A' ? 'bg-white/40 backdrop-blur-sm border border-white/50 focus-within:bg-white/60' : 'bg-white border border-gray-200 focus-within:border-sakura-pink'}
      `}>
                <Search size={18} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索记录、宝宝或小贴士"
                    className="bg-transparent border-none outline-none w-full text-sm text-sakura-text placeholder-gray-400"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
                {/* Theme Toggle in Header (optional since we have floating switcher) */}
                <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors" aria-label="Toggle Theme">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{theme === 'A' ? 'CUTE' : 'FRESH'}</span>
                    {theme === 'A' ? <ToggleRight className="text-sakura-pink" /> : <ToggleLeft className="text-gray-400" />}
                </button>

                <div className="h-8 w-[1px] bg-gray-300 mx-2"></div>

                <button className="p-2 rounded-full hover:bg-black/5 text-gray-500 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 rounded-full hover:bg-black/5 text-gray-500 transition-colors">
                    <HelpCircle size={20} />
                </button>

                <div className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-200">
                    <img src="https://api.dicebear.com/7.x/miniavs/svg?seed=Baby" alt="User" className="w-8 h-8 rounded-full bg-sakura-bg" />
                    <div className="hidden lg:block text-right">
                        <div className="text-xs font-bold text-sakura-text">Mama Sakura</div>
                        <div className="text-[10px] text-gray-400">Admin</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-500 hover:bg-black/5 transition-colors"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold hidden lg:inline">退出</span>
                </button>
            </div>
        </header>
    );
};
