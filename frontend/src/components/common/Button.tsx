import { useTheme } from '../../contexts/ThemeContext';
import { InlineLoading } from './Loading';
import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    children: ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) => {
    const { theme } = useTheme();

    const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm min-h-[36px]',
        md: 'px-4 py-2 text-base min-h-[44px]',
        lg: 'px-6 py-3 text-lg min-h-[48px]',
    };

    const variantClasses = {
        primary: theme === 'A'
            ? 'bg-sakura-pink text-white shadow-lg shadow-sakura-pink/30 hover:shadow-sakura-pink/50 border border-white/30 backdrop-blur-sm'
            : 'bg-sakura-pink text-white shadow-md shadow-sakura-pink/20 hover:shadow-lg hover:shadow-sakura-pink/30',
        secondary: theme === 'A'
            ? 'bg-white/60 text-sakura-text border border-white/60 hover:bg-white/80 backdrop-blur-sm'
            : 'bg-white text-sakura-text border border-gray-200 hover:bg-gray-50',
        ghost: 'bg-transparent text-sakura-text/70 hover:text-sakura-text hover:bg-sakura-bg/50',
        danger: 'bg-red-500 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <InlineLoading />}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </button>
    );
};

// FAB (Floating Action Button)
export const FAB = ({
    icon,
    label,
    onClick,
    position = 'bottom-right',
    className = '',
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
    className?: string;
}) => {
    const { theme } = useTheme();

    const positionClasses = {
        'bottom-right': 'fixed bottom-8 right-6',
        'bottom-left': 'fixed bottom-8 left-6',
        'bottom-center': 'fixed bottom-8 left-1/2 -translate-x-1/2',
    };

    return (
        <button
            onClick={onClick}
            className={`${positionClasses[position]} h-14 px-5 rounded-full flex items-center gap-2 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 min-h-[56px] ${theme === 'A'
                ? 'bg-sakura-pink shadow-sakura-pink/40 border border-white/30 backdrop-blur-sm'
                : 'bg-sakura-pink shadow-sakura-pink/30'
                } ${className}`}
            aria-label={label}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

// Icon Button
export const IconButton = ({
    icon,
    label,
    onClick,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}: {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { theme } = useTheme();

    const sizeClasses = {
        sm: 'w-8 h-8 min-h-[32px]',
        md: 'w-10 h-10 min-h-[44px]',
        lg: 'w-12 h-12 min-h-[48px]',
    };

    const variantClasses = {
        primary: theme === 'A'
            ? 'bg-sakura-pink text-white shadow-md shadow-sakura-pink/30 hover:shadow-sakura-pink/50'
            : 'bg-sakura-pink text-white shadow-sm shadow-sakura-pink/20 hover:shadow-md',
        ghost: 'bg-transparent text-sakura-text/70 hover:text-sakura-text hover:bg-sakura-bg/50',
        danger: 'bg-transparent text-red-500 hover:bg-red-50',
    };

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center justify-center rounded-xl transition-all active:scale-95 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            aria-label={label}
            title={label}
            {...props}
        >
            {icon}
        </button>
    );
};
