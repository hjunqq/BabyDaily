import { TextBox } from 'devextreme-react/text-box';
import { List } from 'devextreme-react/list';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { useRecords } from '../../hooks/useRecords';
import type { BabyRecord } from '../../types';

export const RecordsMobile = () => {
  const navigate = useNavigate();
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const { records, loading: recordsLoading, error: recordsError } = useRecords(baby?.id || null, 30, 0);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return records;
    return records.filter(item => {
      const detail = mapRecordDetail(item);
      return `${item.type} ${detail}`.toLowerCase().includes(query.toLowerCase());
    });
  }, [records, query]);

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
      <h2 className="bd-title" style={{ fontSize: 22 }}>记录时间轴</h2>
      <TextBox
        placeholder="搜索记录"
        stylingMode="outlined"
        width="100%"
        value={query}
        onValueChanged={e => setQuery(e.value)}
      />
      <div className="bd-card" style={{ marginTop: 12 }}>
        <List
          dataSource={filtered}
          noDataText="暂无记录"
          itemRender={(item: BabyRecord) => (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E8DCD6' }}
              onClick={() => navigate(`/record/${item.id}`)}
            >
              <div>
                <strong>{new Date(item.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</strong> · {mapRecordType(item.type)}
              </div>
              <div style={{ fontWeight: 600 }}>{mapRecordDetail(item)}</div>
            </div>
          )}
        />
      </div>
    </div>
  );
};

const mapRecordType = (type: BabyRecord['type']) => {
  switch (type) {
    case 'FEED':
      return '喂奶';
    case 'DIAPER':
      return '尿布';
    case 'SLEEP':
      return '睡眠';
    case 'BATH':
      return '洗澡';
    case 'HEALTH':
      return '健康';
    case 'GROWTH':
      return '成长';
    case 'MILESTONE':
      return '里程碑';
    default:
      return '记录';
  }
};

const mapRecordDetail = (record: BabyRecord) => {
  if (record.type === 'FEED') {
    const details: any = record.details || {};
    const amount = details.amount ? `${details.amount}${details.unit || 'ml'}` : '';
    return amount || record.remark || '-';
  }
  if (record.type === 'DIAPER') {
    const t = (record.details as any)?.type;
    if (t === 'BOTH') return '尿 + 便';
    if (t === 'POO') return '便便';
    return '尿尿';
  }
  if (record.type === 'SLEEP') {
    return record.remark || '睡眠';
  }
  return record.remark || '-';
};
