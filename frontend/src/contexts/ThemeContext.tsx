import { createContext, useContext, useState, type ReactNode } from 'react';

type Theme = 'A' | 'B';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('B');

  const toggleTheme = () => {
    setTheme(prev => prev === 'A' ? 'B' : 'A');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="bd-app">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
