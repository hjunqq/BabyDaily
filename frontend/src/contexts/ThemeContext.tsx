import { createContext, useContext, useState, type ReactNode } from 'react';

type Theme = 'B';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme] = useState<Theme>('B');

  return (
    <ThemeContext.Provider value={{ theme }}>
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
