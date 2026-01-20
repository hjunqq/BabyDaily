import { Edit2, Trash2, Download } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { IconButton } from '../common/Button';
import { useState } from 'react';
import { BabyService } from '../../services/api';
import { API_URL } from '../../config/env';

interface Activity {
    id: string;
    time: string;
    category: string;
    detail: string;
    duration: string;
    type?: string;
}

interface ActivityTableProps {
    activities: Activity[];
    onUpdate?: () => void;
    onEdit?: (id: string) => void;
}

export const ActivityTable = ({ activities, onUpdate, onEdit }: ActivityTableProps) => {
    const { theme } = useTheme();
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleEdit = (id: string) => {
        onEdit ? onEdit(id) : alert(`编辑记录：${id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条记录吗？')) return;
        setDeleting(id);
        try {
            await BabyService.deleteRecord(id);
            onUpdate?.();
        } catch (error) {
            alert('删除失败，请重试');
        } finally {
            setDeleting(null);
        }
    };

    const handleExport = async () => {
        try {
            const babyId = BabyService.getCurrentBabyId() || (await BabyService.ensureDevEnvironment()).id;
            if (!babyId) throw new Error('未找到宝宝信息');
            const res = await fetch(`${API_URL}/records/baby/${babyId}/export?limit=200`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
            });
            if (!res.ok) throw new Error(`导出失败：${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `records-${babyId}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.message || '导出失败');
        }
    };

    return (
        <div className={`p-6 transition-all ${theme === 'A' ? 'glass-panel rounded-2xl' : 'bg-white rounded-2xl shadow-sm border border-gray-100'}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display font-bold text-lg text-sakura-text">最近活动</h3>
                    <p className="text-xs text-sakura-text/50 mt-1">查看和管理最近的记录</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 text-sm font-bold text-sakura-pink hover:text-sakura-text transition-colors min-h-[44px] px-3 rounded-xl"
                    aria-label="导出活动记录"
                >
                    <Download size={16} /> 导出
                </button>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-sakura-text/10">
                            <th className="text-left py-4 px-4 text-xs font-bold text-sakura-text/60 uppercase tracking-wider bg-sakura-bg/30">时间</th>
                            <th className="text-left py-4 px-4 text-xs font-bold text-sakura-text/60 uppercase tracking-wider bg-sakura-bg/30">类型</th>
                            <th className="text-left py-4 px-4 text-xs font-bold text-sakura-text/60 uppercase tracking-wider bg-sakura-bg/30">详情</th>
                            <th className="text-left py-4 px-4 text-xs font-bold text-sakura-text/60 uppercase tracking-wider bg-sakura-bg/30">时长</th>
                            <th className="text-right py-4 px-4 text-xs font-bold text-sakura-text/60 uppercase tracking-wider bg-sakura-bg/30">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sakura-text/5">
                        {activities.map((item) => (
                            <tr
                                key={item.id}
                                className="group hover:bg-sakura-pink/5 transition-colors"
                                onMouseEnter={() => setHoveredRow(item.id)}
                                onMouseLeave={() => setHoveredRow(null)}
                            >
                                <td className="py-4 px-4 text-sm font-bold text-sakura-text min-h-[48px]">{item.time}</td>
                                <td className="py-4 px-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sakura-pink/10 text-sakura-text">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-sm text-sakura-text/70">{item.detail}</td>
                                <td className="py-4 px-4 text-sm text-sakura-text/70">{item.duration}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <IconButton
                                            icon={<Edit2 size={16} />}
                                            label="编辑记录"
                                            onClick={() => handleEdit(item.id)}
                                            variant="ghost"
                                            size="md"
                                            className={`${hoveredRow === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                        />
                                        <IconButton
                                            icon={<Trash2 size={16} />}
                                            label={deleting === item.id ? '删除中...' : '删除记录'}
                                            onClick={() => handleDelete(item.id)}
                                            variant="danger"
                                            size="md"
                                            disabled={deleting === item.id}
                                            className={`${hoveredRow === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
