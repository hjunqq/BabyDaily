import { Button } from 'devextreme-react/button';
import { Form, Item } from 'devextreme-react/form';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BabyService } from '../../services/api';
import type { BabyRecord } from '../../types';

export const RecordDetailDesktop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<BabyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await BabyService.getRecord(id);
        setRecord(data);
      } catch (err: any) {
        setError(err?.message || '获取记录详情失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await BabyService.deleteRecord(id);
    navigate('/records');
  };

  if (loading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error || '记录不存在'}</p>
        </div>
      </div>
    );
  }

  const formData = {
    type: mapRecordType(record.type),
    time: new Date(record.time).toLocaleString('zh-CN'),
    remark: record.remark || '',
  };

  return (
    <div>
      <h2 className="bd-title">记录详情</h2>
      <div className="bd-card" style={{ maxWidth: 520 }}>
        <Form formData={formData} readOnly labelMode="floating" colCount={1}>
          <Item dataField="type" label={{ text: '类型' }} />
          <Item dataField="time" label={{ text: '时间' }} />
          <Item dataField="remark" label={{ text: '备注' }} />
        </Form>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Button text="编辑" type="default" stylingMode="contained" height={40} onClick={() => navigate(`/record/${record.id}/edit`)} />
          <Button text="删除" type="danger" stylingMode="outlined" height={40} onClick={handleDelete} />
        </div>
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
