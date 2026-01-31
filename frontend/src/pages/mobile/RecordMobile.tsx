import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { DateBox } from 'devextreme-react/date-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { CheckBox } from 'devextreme-react/check-box';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BabyService } from '../../services/api';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
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

export const RecordMobile = () => {
  const navigate = useNavigate();
  const { baby } = useCurrentBaby();
  const [type, setType] = useState<BabyRecord['type']>('FEED');
  const [time, setTime] = useState<Date>(new Date());
  const [remark, setRemark] = useState('');
  const [amount, setAmount] = useState<number>(120);
  const [feedSubtype, setFeedSubtype] = useState('BOTTLE');
  const [duration, setDuration] = useState('');
  const [diaperType, setDiaperType] = useState('PEE');
  const [isNap, setIsNap] = useState(true);
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!baby?.id) return;
    setSaving(true);
    try {
      const details = buildDetails(type, { amount, feedSubtype, duration, diaperType, isNap, location });
      await BabyService.createRecord({
        baby_id: baby.id,
        type,
        time: time.toISOString(),
        details,
        remark,
      });
      navigate('/mobile/records');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="bd-title" style={{ fontSize: 22 }}>快速记录</h2>
      <div className="bd-card">
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

          <div style={{ marginTop: 8 }}>
            <div className="bd-section-title" style={{ fontSize: 13, marginBottom: 8 }}>快捷量表</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['60', '90', '120', '150'].map(item => (
                <Button key={item} text={`${item} ml`} stylingMode="outlined" height={32} onClick={() => setAmount(Number(item))} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bd-fab">
        <Button text={saving ? '保存中...' : '保存记录'} type="default" stylingMode="contained" height={44} onClick={handleSubmit} disabled={saving} />
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
