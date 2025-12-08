import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${theme === 'A'
                ? 'bg-gradient-to-b from-sakura-bg to-white'
                : 'bg-sakura-bg-alt'
            }`}>
            {/* Background decorations for Theme A */}
            {theme === 'A' && (
                <>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sakura-pink/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-sakura-accent/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                </>
            )}

            <div className={`mx-auto max-w-[480px] min-h-screen relative z-10 ${theme === 'B' ? 'bg-white shadow-xl shadow-gray-100/50' : ''
                }`}>
                {children}
            </div>

            <ThemeSwitcher />
        </div>
    );
};
