import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { List } from 'devextreme-react/list';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useMemo, useState } from 'react';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { useRecords } from '../../hooks/useRecords';
import { BabyService } from '../../services/api';
import type { BabyRecord } from '../../types';
import { useNavigate } from 'react-router-dom';
import { mapRecordType, mapRecordDetail } from '../../utils/recordMappers';

export const RecordsDesktop = () => {
  const navigate = useNavigate();
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const { records, loading: recordsLoading, error: recordsError } = useRecords(baby?.id || null, 50, 0);
  const [query, setQuery] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query) return records;
    return records.filter(item => {
      const detail = mapRecordDetail(item);
      return `${item.type} ${detail}`.toLowerCase().includes(query.toLowerCase());
    });
  }, [records, query]);

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;

    try {
      await BabyService.deleteRecords(Array.from(selectedIds));
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('删除失败');
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="bd-title">记录时间轴</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {isSelectionMode ? (
            <>
              <Button text={selectedIds.size === filtered.length ? "取消全选" : "全选"} onClick={handleSelectAll} stylingMode="outlined" />
              <Button text={`删除 (${selectedIds.size})`} type="danger" stylingMode="contained" disabled={selectedIds.size === 0} onClick={handleDeleteSelected} />
              <Button text="退出选择" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} stylingMode="text" />
            </>
          ) : (
            <Button text="批量操作" onClick={() => setIsSelectionMode(true)} stylingMode="text" />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <TextBox
          placeholder="搜索记录"
          width={320}
          stylingMode="outlined"
          value={query}
          onValueChanged={e => setQuery(e.value)}
        />
        {!isSelectionMode && (
          <Button text="+ 新建记录" type="default" stylingMode="contained" height={40} onClick={() => navigate('/record')} />
        )}
      </div>

      <div className="bd-card">
        <List
          dataSource={filtered}
          noDataText="暂无记录"
          itemRender={(item: BabyRecord) => (
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E8DCD6', cursor: 'pointer' }}
              onClick={() => {
                if (isSelectionMode) toggleSelection(item.id);
                else navigate(`/record/${item.id}`);
              }}
            >
              {isSelectionMode && (
                <div style={{ marginRight: 16 }} onClick={(e) => toggleSelection(item.id, e)}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: '2px solid #ddd',
                    background: selectedIds.has(item.id) ? '#ff9aa2' : '#fff',
                    borderColor: selectedIds.has(item.id) ? '#ff9aa2' : '#ddd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
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
    </div>
  );
};
