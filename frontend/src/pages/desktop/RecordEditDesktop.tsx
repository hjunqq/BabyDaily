import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { DateBox } from 'devextreme-react/date-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { CheckBox } from 'devextreme-react/check-box';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BabyService } from '../../services/api';
import type { BabyRecord } from '../../types';

const recordTypes = [
  { id: 'FEED', text: '喂奶' },
  { id: 'DIAPER', text: '尿布' },
  { id: 'SLEEP', text: '睡眠' },
];

const feedSubtypes = [
  { id: 'BOTTLE', text: '奶瓶' },
  { id: 'BREAST', text: '母乳' },
  { id: 'SOLID', text: '辅食' },
];

const diaperTypes = [
  { id: 'PEE', text: '尿尿' },
  { id: 'POO', text: '便便' },
  { id: 'BOTH', text: '尿 + 便' },
];

export const RecordEditDesktop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [type, setType] = useState<BabyRecord['type']>('FEED');
  const [time, setTime] = useState<Date>(new Date());
  const [remark, setRemark] = useState('');
  const [amount, setAmount] = useState<number>(120);
  const [feedSubtype, setFeedSubtype] = useState('BOTTLE');
  const [duration, setDuration] = useState('');
  const [diaperType, setDiaperType] = useState('PEE');
  const [isNap, setIsNap] = useState(true);
  const [location, setLocation] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const record = await BabyService.getRecord(id);
        setType(record.type);
        setTime(new Date(record.time));
        setRemark(record.remark || '');
        if (record.type === 'FEED') {
          const details: any = record.details || {};
          setFeedSubtype(details.subtype || 'BOTTLE');
          setAmount(details.amount ?? 120);
          setDuration(details.duration || '');
        }
        if (record.type === 'DIAPER') {
          const details: any = record.details || {};
          setDiaperType(details.type || 'PEE');
        }
        if (record.type === 'SLEEP') {
          const details: any = record.details || {};
          setIsNap(!!details.is_nap);
          setLocation(details.location || '');
        }
      } catch (err: any) {
        setError(err?.message || '加载记录失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const details = buildDetails(type, { amount, feedSubtype, duration, diaperType, isNap, location });
      await BabyService.updateRecord(id, {
        type,
        time: time.toISOString(),
        details,
        remark,
      });
      navigate(`/web/record/${id}`);
    } finally {
      setSaving(false);
    }
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

  if (error) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title">编辑记录</h2>
      <div className="bd-card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <SelectBox dataSource={recordTypes} valueExpr="id" displayExpr="text" value={type} onValueChanged={e => setType(e.value)} />
          <DateBox type="datetime" value={time} onValueChanged={e => setTime(e.value)} />

          {type === 'FEED' && (
            <>
              <SelectBox dataSource={feedSubtypes} valueExpr="id" displayExpr="text" value={feedSubtype} onValueChanged={e => setFeedSubtype(e.value)} />
              <NumberBox value={amount} onValueChanged={e => setAmount(e.value ?? 0)} placeholder="奶量 (ml)" />
              <TextBox value={duration} onValueChanged={e => setDuration(e.value)} placeholder="持续时间 (如 15m)" />
            </>
          )}

          {type === 'DIAPER' && (
            <SelectBox dataSource={diaperTypes} valueExpr="id" displayExpr="text" value={diaperType} onValueChanged={e => setDiaperType(e.value)} />
          )}

          {type === 'SLEEP' && (
            <>
              <CheckBox value={isNap} onValueChanged={e => setIsNap(!!e.value)} text="小睡" />
              <TextBox value={location} onValueChanged={e => setLocation(e.value)} placeholder="睡眠地点" />
            </>
          )}

          <TextArea value={remark} onValueChanged={e => setRemark(e.value)} placeholder="备注" />

          <Button text={saving ? '保存中...' : '保存修改'} type="default" stylingMode="contained" height={40} onClick={handleSubmit} disabled={saving} />
        </div>
      </div>
    </div>
  );
};

const buildDetails = (type: BabyRecord['type'], form: any) => {
  if (type === 'FEED') {
    return {
      subtype: form.feedSubtype,
      amount: form.amount || undefined,
      unit: 'ml',
      duration: form.duration || undefined,
    };
  }
  if (type === 'DIAPER') {
    return {
      type: form.diaperType,
    };
  }
  if (type === 'SLEEP') {
    return {
      is_nap: form.isNap,
      location: form.location || undefined,
    };
  }
  return {};
};
