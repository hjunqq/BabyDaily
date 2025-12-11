import { useState } from 'react';
import { Plus } from 'lucide-react';
import { KPIGrid } from '../components/web/KPIGrid';
import { TrendChart } from '../components/web/TrendChart';
import { ActivityTable } from '../components/web/ActivityTable';
import { RecordForm } from '../components/web/RecordForm';
import { RecordEditForm } from '../components/web/RecordEditForm';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardSkeleton, EmptyState, ErrorState, Button } from '../components/common';

export const Dashboard = () => {
    const { loading, error, summary, trends, activities, refresh } = useDashboardData();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAddRecord = () => setShowForm(true);
    const handleFormSuccess = () => refresh();
    const handleEdit = (id: string) => setEditingId(id);

    if (loading) return <DashboardSkeleton />;
    if (error) {
        return (
            <ErrorState
                type="server"
                message={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    const hasData = activities.length > 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold text-sakura-text">今日总览</h2>
                    <p className="text-sakura-text/60 text-sm">查看宝宝今天的喂养、睡眠与尿布记录</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={handleAddRecord}>
                    添加记录
                </Button>
            </div>

            <KPIGrid
                milkMl={summary.milkMl}
                diaperWet={summary.diaperWet}
                diaperSoiled={summary.diaperSoiled}
                sleepMinutes={summary.sleepMinutes}
                lastFeedTime={summary.lastFeedTime}
            />

            {hasData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TrendChart data={trends} />
                    </div>
                    <div className="lg:col-span-1">
                        <ActivityTable activities={activities} onUpdate={refresh} onEdit={handleEdit} />
                    </div>
                </div>
            ) : (
                <EmptyState
                    type="no-records"
                    action={{
                        label: '添加第一条记录',
                        onClick: handleAddRecord,
                    }}
                />
            )}

            {showForm && (
                <RecordForm onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />
            )}
            {editingId && (
                <RecordEditForm
                    recordId={editingId}
                    onClose={() => setEditingId(null)}
                    onSuccess={() => {
                        setEditingId(null);
                        refresh();
                    }}
                />
            )}
        </div>
    );
};
