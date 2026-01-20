import { useTheme } from '../../contexts/ThemeContext';

export const MobileHeader = () => {
    const { theme } = useTheme();
    const today = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <header className="px-6 pt-8 pb-4 flex items-center justify-between">
            <div>
                <h2 className="text-sakura-text/60 text-sm font-medium mb-1">{today}</h2>
                <h1 className="text-2xl font-bold text-sakura-text font-display">
                    你好，樱花
                </h1>
            </div>

            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${theme === 'A'
                    ? 'border-white shadow-lg shadow-sakura-pink/20 ring-2 ring-sakura-pink/20'
                    : 'border-sakura-pink/30'
                }`}>
                <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura&backgroundColor=ffb7c5"
                    alt="宝宝头像"
                    className="w-full h-full object-cover"
                />
            </div>
        </header>
    );
};
