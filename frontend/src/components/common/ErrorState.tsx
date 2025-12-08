import { useTheme } from '../../contexts/ThemeContext';
import { AlertCircle, RefreshCw, WifiOff, X } from 'lucide-react';
import { type ReactNode } from 'react';

interface ErrorStateProps {
    type?: 'network' | 'server' | 'generic';
    title?: string;
    message?: string;
    icon?: ReactNode;
    onRetry?: () => void;
    retryLabel?: string;
}

const defaultErrors = {
    network: {
        title: '网络连接失败',
        message: '请检查网络连接后重试',
        icon: <WifiOff size={64} className="text-red-400" />,
    },
    server: {
        title: '服务器错误',
        message: '服务暂时不可用，请稍后再试',
        icon: <AlertCircle size={64} className="text-red-400" />,
    },
    generic: {
        title: '出错了',
        message: '发生了一些问题，请重试',
        icon: <AlertCircle size={64} className="text-red-400" />,
    },
};

export const ErrorState = ({
    type = 'generic',
    title,
    message,
    icon,
    onRetry,
    retryLabel = '重试',
}: ErrorStateProps) => {
    const { theme } = useTheme();

    const displayIcon = icon || defaultErrors[type].icon;
    const displayTitle = title || defaultErrors[type].title;
    const displayMessage = message || defaultErrors[type].message;

    return (
        <div
            className={`flex flex-col items-center justify-center py-16 px-6 rounded-3xl ${theme === 'A'
                ? 'glass-panel'
                : 'bg-white border border-gray-100'
                }`}
            role="alert"
            aria-live="assertive"
        >
            <div className="mb-4 opacity-80">{displayIcon}</div>
            <h3 className="text-xl font-display font-bold text-sakura-text mb-2">
                {displayTitle}
            </h3>
            <p className="text-sm text-sakura-text/60 text-center max-w-md mb-6">
                {displayMessage}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn-primary flex items-center gap-2"
                    aria-label={retryLabel}
                >
                    <RefreshCw size={18} />
                    {retryLabel}
                </button>
            )}
        </div>
    );
};

export const InlineError = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 text-sm text-red-500 mt-2" role="alert">
        <AlertCircle size={16} />
        <span>{message}</span>
    </div>
);

export const ErrorToast = ({ message, onClose }: { message: string; onClose?: () => void }) => {
    const { theme } = useTheme();

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg max-w-md ${theme === 'A'
                ? 'bg-white/90 backdrop-blur-md border border-red-200'
                : 'bg-white border border-red-200'
                }`}
            role="alert"
            aria-live="polite"
        >
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-sakura-text flex-1">{message}</p>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-sakura-text/40 hover:text-sakura-text transition-colors"
                    aria-label="关闭"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};
