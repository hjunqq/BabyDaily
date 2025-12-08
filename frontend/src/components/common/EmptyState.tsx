import { useTheme } from '../../contexts/ThemeContext';
import { Baby, FileQuestion, Search, Inbox } from 'lucide-react';
import { type ReactNode } from 'react';

interface EmptyStateProps {
    type?: 'no-data' | 'no-results' | 'no-records' | 'custom';
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const defaultIcons = {
    'no-data': <Inbox size={64} className="text-sakura-pink/40" />,
    'no-results': <Search size={64} className="text-sakura-pink/40" />,
    'no-records': <Baby size={64} className="text-sakura-pink/40" />,
    'custom': <FileQuestion size={64} className="text-sakura-pink/40" />,
};

const defaultMessages = {
    'no-data': {
        title: '暂无数据',
        description: '还没有任何记录，快去添加第一条吧！',
    },
    'no-results': {
        title: '没有找到结果',
        description: '试试调整筛选条件或搜索关键词',
    },
    'no-records': {
        title: '还没有记录',
        description: '开始记录宝宝的每一个温柔瞬间',
    },
    'custom': {
        title: '空空如也',
        description: '这里还没有内容',
    },
};

export const EmptyState = ({
    type = 'no-data',
    title,
    description,
    icon,
    action,
}: EmptyStateProps) => {
    const { theme } = useTheme();

    const displayIcon = icon || defaultIcons[type];
    const displayTitle = title || defaultMessages[type].title;
    const displayDescription = description || defaultMessages[type].description;

    return (
        <div
            className={`flex flex-col items-center justify-center py-16 px-6 rounded-3xl ${theme === 'A'
                ? 'glass-panel'
                : 'bg-white border border-gray-100'
                }`}
            role="status"
            aria-label={displayTitle}
        >
            <div className="mb-4 opacity-60">{displayIcon}</div>
            <h3 className="text-xl font-display font-bold text-sakura-text mb-2">
                {displayTitle}
            </h3>
            <p className="text-sm text-sakura-text/60 text-center max-w-md mb-6">
                {displayDescription}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn-primary"
                    aria-label={action.label}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
