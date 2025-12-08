// import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeSwitcher = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-white/80 backdrop-blur-md border border-sakura-pink/20 shadow-lg shadow-sakura-pink/20 hover:scale-105 transition-all text-sakura-text"
            title={`Current Theme: ${theme}`}
        >
            <div className="flex items-center gap-2 font-bold text-sm">
                {theme === 'A' ? '🌸 A' : '🌿 B'}
            </div>
        </button>
    );
};
