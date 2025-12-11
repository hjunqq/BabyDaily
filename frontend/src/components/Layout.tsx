import React from 'react';
import { Header } from './Header';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSwitcher } from './common/ThemeSwitcher';
import { Navigation } from './Navigation';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useTheme();

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${theme === 'A' ? 'bg-gradient-to-br from-sakura-bg to-white' : 'bg-sakura-bg-alt'}`}>
            <Navigation variant="sidebar" />
            <div className="flex-1 ml-64 p-8">
                <Header />
                <main className="max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
            <ThemeSwitcher />
        </div>
    );
};
