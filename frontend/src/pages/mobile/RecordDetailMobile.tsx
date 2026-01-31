import { Button } from 'devextreme-react/button';
import { Form, Item } from 'devextreme-react/form';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BabyService } from '../../services/api';
import type { BabyRecord } from '../../types';

export const RecordDetailMobile = () => {
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

  const mapDiaperType = (t: string) => {
    switch (t) {
      case 'PEE': return '尿尿';
      case 'POO': return '便便';
      case 'BOTH': return '尿尿 + 便便';
      default: return t;
    }
  };

  const formData: any = {
    recordType: mapRecordType(record.type),
    time: new Date(record.time).toLocaleString('zh-CN'),
    remark: record.remark || '',
  };

  if (record.details) {
    if (record.type === 'FEED') {
      const feed = record.details as any;
      formData.amount = `${feed.amount || 0} ${feed.subtype === 'SOLID' ? 'g' : 'ml'}`;
      formData.subtype = feed.subtype === 'SOLID' ? '辅食' : '奶';
    } else if (record.type === 'SLEEP') {
      const sleep = record.details as any;
      formData.duration = `${sleep.duration || 0} 分钟`;
    } else if (record.type === 'DIAPER') {
      const diaper = record.details as any;
      formData.diaperType = mapDiaperType(diaper.type);
    }
  }

  return (
    <div>
      <h2 className="bd-title" style={{ fontSize: 22 }}>记录详情</h2>
      <div className="bd-card">
        <Form formData={formData} readOnly labelMode="floating" colCount={1}>
          <Item dataField="recordType" label={{ text: '类型' }} />
          <Item dataField="time" label={{ text: '时间' }} />
          {record.type === 'FEED' && (
            <Item dataField="amount" label={{ text: '量' }} />
          )}
          {record.type === 'FEED' && (
            <Item dataField="subtype" label={{ text: '分类' }} />
          )}
          {record.type === 'SLEEP' && (
            <Item dataField="duration" label={{ text: '时长' }} />
          )}
          {record.type === 'DIAPER' && (
            <Item dataField="diaperType" label={{ text: '尿布详情' }} />
          )}
          <Item dataField="remark" label={{ text: '备注' }} />
        </Form>
      </div>
      <div className="bd-fab">
        <Button text="编辑记录" type="default" stylingMode="contained" height={44} onClick={() => navigate(`/record/${record.id}/edit`)} />
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
