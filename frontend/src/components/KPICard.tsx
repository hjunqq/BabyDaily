import { useTheme } from '../contexts/ThemeContext';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon?: React.ReactNode;
    color?: string;
}

export const KPICard = ({ title, value, subtitle, icon }: KPICardProps) => {
    const { theme } = useTheme();

    return (
        <div className={`
      relative overflow-hidden p-6 rounded-3xl transition-all duration-300 group
      ${theme === 'A'
                ? 'bg-white/40 backdrop-blur-md border border-white/60 shadow-lg shadow-sakura-pink/10 hover:shadow-sakura-pink/20 hover:-translate-y-1'
                : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
            }
    `}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${theme === 'A' ? 'text-gray-500' : 'text-gray-400'}`}>{title}</h3>
                    <div className="text-3xl font-display font-bold text-sakura-text">{value}</div>
                </div>
                {icon && (
                    <div className={`p-3 rounded-2xl ${theme === 'A' ? 'bg-white/50 text-sakura-pink' : 'bg-sakura-bg text-sakura-pink'}`}>
                        {icon}
                    </div>
                )}
            </div>
            <div className="text-sm text-gray-500 font-medium">
                {subtitle}
            </div>
        </div>
    );
};
