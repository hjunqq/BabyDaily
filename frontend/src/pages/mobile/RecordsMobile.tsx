import { TextBox } from 'devextreme-react/text-box';
import { List } from 'devextreme-react/list';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { useRecords } from '../../hooks/useRecords';
import { BabyService } from '../../services/api';
import type { BabyRecord } from '../../types';
import { mapRecordType, mapRecordDetail } from '../../utils/recordMappers';

export const RecordsMobile = () => {
  const navigate = useNavigate();
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const { records, loading: recordsLoading, error: recordsError } = useRecords(baby?.id || null, 30, 0);
  const [query, setQuery] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groupedData = useMemo(() => {
    if (!records) return [];

    // Filter first
    const list = query ? records.filter(item => {
      const detail = mapRecordDetail(item);
      return `${item.type} ${detail}`.toLowerCase().includes(query.toLowerCase());
    }) : records;

    // Then group
    const groups: { key: string; items: BabyRecord[] }[] = [];

    list.forEach(item => {
      const date = new Date(item.time);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let key = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' });

      if (date.toDateString() === today.toDateString()) {
        key = '今天';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = '昨天';
      }

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key === key) {
        lastGroup.items.push(item);
      } else {
        groups.push({ key, items: [item] });
      }
    });

    return groups;
  }, [records, query]);

  // Compatibility for 'filtered' usage in other parts if any (but we specifically targeted the rendering)
  // We need to update handleSelectAll and handleDeleteSelected to work with groupedData or flattened list
  const flatList = useMemo(() => groupedData.flatMap(g => g.items), [groupedData]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;

    try {
      await BabyService.deleteRecords(Array.from(selectedIds));
      // Refresh list - simplest way is to reload or invalidate cache if we had one.
      // Since useRecords uses internal state, we might need to trigger a refresh.
      // But useRecords doesn't expose refresh directly here? 
      // Actually useRecords returns `mutate` or we can force remount.
      // For now, let's just navigation or reload. 
      // Better: expose refresh from useRecords or use a global event.
      // Let's modify useRecords later if needed, but for now simple reload works.
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('删除失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === flatList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flatList.map(r => r.id)));
    }
  };

  if (babyLoading || recordsLoading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (babyError || recordsError) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{babyError || recordsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: isSelectionMode ? 80 : 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="bd-title" style={{ fontSize: 22, margin: 0 }}>记录时间轴</h2>
        <Button
          text={isSelectionMode ? '取消' : '选择'}
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedIds(new Set());
          }}
          stylingMode="text"
        />
      </div>

      <TextBox
        placeholder="搜索记录"
        stylingMode="outlined"
        width="100%"
        value={query}
        onValueChanged={e => setQuery(e.value)}
      />
      <div className="bd-card" style={{ marginTop: 12 }}>
        <List
          dataSource={groupedData}
          noDataText="暂无记录"
          grouped={true}
          collapsibleGroups={false}
          groupRender={(data) => <div className="bd-list-group-header">{data.key}</div>}
          itemRender={(item: BabyRecord) => (
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E8DCD6' }}
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelection(item.id);
                } else {
                  navigate(`/record/${item.id}`);
                }
              }}
            >
              {isSelectionMode && (
                <div style={{ marginRight: 12 }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: '2px solid #ddd',
                    background: selectedIds.has(item.id) ? '#FF9AA2' : 'transparent',
                    borderColor: selectedIds.has(item.id) ? '#FF9AA2' : '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedIds.has(item.id) && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
                  </div>
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{new Date(item.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</strong> · {mapRecordType(item.type)}
                </div>
                <div style={{ fontWeight: 600 }}>{mapRecordDetail(item)}</div>
              </div>
            </div>
          )}
        />
      </div>

      {isSelectionMode && (
        <div style={{
          position: 'fixed', bottom: 60, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #eee', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 999
        }}>
          <Button
            text={selectedIds.size === flatList.length ? '取消全选' : '全选'}
            stylingMode="text"
            onClick={handleSelectAll}
          />
          <Button
            text={`删除 (${selectedIds.size})`}
            type="danger"
            stylingMode="contained"
            disabled={selectedIds.size === 0}
            onClick={handleDeleteSelected}
          />
        </div>
      )}
    </div>
  );
};
