import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const Skeleton = ({
    variant = 'text',
    width,
    height,
    className = '',
}: SkeletonProps) => {
    const { theme } = useTheme();

    const baseClasses = `animate-pulse ${theme === 'A' ? 'bg-white/40' : 'bg-gray-200'
        }`;

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-2xl',
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'circular' ? width : undefined),
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

// KPI 卡片骨架屏
export const KPICardSkeleton = () => {
    const { theme } = useTheme();
    return (
        <div
            className={`p-6 h-40 rounded-2xl ${theme === 'A' ? 'glass-panel' : 'bg-white border border-gray-100'
                }`}
        >
            <div className="flex items-start justify-between mb-4">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="circular" width={40} height={40} />
            </div>
            <Skeleton variant="text" width="80%" height={32} className="mb-2" />
            <Skeleton variant="text" width="50%" />
        </div>
    );
};

// 列表项骨架屏
export const ListItemSkeleton = () => {
    const { theme } = useTheme();
    return (
        <div
            className={`p-4 rounded-2xl ${theme === 'A' ? 'glass-panel' : 'bg-white border border-gray-100'
                }`}
        >
            <div className="flex items-center gap-3">
                <Skeleton variant="text" width={60} />
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="text" className="flex-1" />
            </div>
        </div>
    );
};

// 卡片骨架屏
export const CardSkeleton = () => {
    const { theme } = useTheme();
    return (
        <div
            className={`p-4 rounded-3xl ${theme === 'A' ? 'glass-panel' : 'bg-white border border-gray-100'
                }`}
        >
            <Skeleton variant="rounded" width="100%" height={200} className="mb-4" />
            <Skeleton variant="text" width="70%" className="mb-2" />
            <Skeleton variant="text" width="50%" />
        </div>
    );
};

// 移动端 Home 骨架屏
export const MobileHomeSkeleton = () => {
    return (
        <div className="max-w-xl mx-auto px-5 pb-28 space-y-6">
            {/* 头部卡片 */}
            <div className="mt-2 p-5 rounded-3xl glass-panel">
                <div className="flex items-center gap-4">
                    <Skeleton variant="circular" width={56} height={56} />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="80%" />
                    </div>
                </div>
            </div>

            {/* KPI 卡片 */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 w-36 p-4 rounded-2xl glass-panel">
                        <Skeleton variant="text" width="70%" className="mb-2" />
                        <Skeleton variant="text" width="90%" height={24} className="mb-1" />
                        <Skeleton variant="text" width="60%" />
                    </div>
                ))}
            </div>

            {/* 列表 */}
            <div className="rounded-3xl p-5 glass-panel space-y-4">
                <Skeleton variant="text" width="40%" className="mb-4" />
                {[1, 2, 3, 4].map((i) => (
                    <ListItemSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

// Dashboard 骨架屏
export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <Skeleton variant="text" width="30%" height={32} />
                <Skeleton variant="text" width="50%" />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <KPICardSkeleton key={i} />
                ))}
            </div>

            {/* Chart & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Skeleton variant="rounded" width="100%" height={400} />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton variant="rounded" width="100%" height={400} />
                </div>
            </div>
        </div>
    );
};
