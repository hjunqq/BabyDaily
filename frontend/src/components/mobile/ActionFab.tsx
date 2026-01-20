import { Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ActionFabProps {
    onClick?: () => void;
}

export const ActionFab = ({ onClick }: ActionFabProps) => {
    const { theme } = useTheme();

    return (
        <button
            onClick={onClick}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full transition-all active:scale-95 shadow-xl z-40 ${theme === 'A'
                ? 'bg-sakura-pink text-white shadow-sakura-pink/40 border border-white/20'
                : 'bg-sakura-text text-white shadow-sakura-text/20 hover:bg-sakura-text/90'
                }`}>
            <Plus size={24} strokeWidth={3} />
            <span className="font-bold text-lg">记录</span>
        </button>
    );
};
