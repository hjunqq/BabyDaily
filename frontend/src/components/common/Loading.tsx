import { useTheme } from '../../contexts/ThemeContext';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

export const Loading = ({ size = 'md', text, fullScreen = false }: LoadingProps) => {
    const { theme } = useTheme();

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-4 border-sakura-pink/20 border-t-sakura-pink rounded-full animate-spin`}
                role="status"
                aria-label="加载中"
            />
            {text && (
                <p className="text-sm font-medium text-sakura-text/60">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div
                className={`fixed inset-0 flex items-center justify-center z-50 ${theme === 'A'
                        ? 'bg-sakura-bg/80 backdrop-blur-sm'
                        : 'bg-sakura-bg/90'
                    }`}
            >
                {spinner}
            </div>
        );
    }

    return spinner;
};

// 内联加载器（用于按钮等）
export const InlineLoading = ({ className = '' }: { className?: string }) => (
    <div
        className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
        role="status"
        aria-label="加载中"
    />
);
