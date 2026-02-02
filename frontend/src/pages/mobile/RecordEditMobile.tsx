import { Button } from 'devextreme-react/button';
import { DateBox } from 'devextreme-react/date-box';
import { TextArea } from 'devextreme-react/text-area';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BabyService } from '../../services/api';
import type { BabyRecord } from '../../types';

// Reuse styles from MobileHome (inline)
const quickSelectStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 8,
  marginBottom: 16
};

const selectionBtnStyle = (active: boolean) => ({
  padding: '8px 4px',
  borderRadius: 8,
  border: active ? '2px solid #F3B6C2' : '1px solid #ddd',
  background: active ? '#F3B6C2' : '#fff',
  color: active ? '#fff' : '#6b524b',
  fontSize: 13,
  fontWeight: active ? 'bold' : 'normal',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
} as React.CSSProperties);

export const RecordEditMobile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Form State
  const [type, setType] = useState<BabyRecord['type']>('FEED');
  const [time, setTime] = useState<Date>(new Date());
  const [remark, setRemark] = useState('');

  // Details State
  // FEED
  const [feedSubtype, setFeedSubtype] = useState<'BOTTLE' | 'BREAST'>('BOTTLE');
  const [amount, setAmount] = useState(120);
  const [duration, setDuration] = useState(15);
  // DIAPER
  const [diaperType, setDiaperType] = useState<'PEE' | 'POO' | 'BOTH'>('PEE');
  // SLEEP
  const [sleepDuration, setSleepDuration] = useState(60);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const record = await BabyService.getRecord(id);
        setType(record.type);
        setTime(new Date(record.time));
        setRemark(record.remark || '');

        const d = record.details as any || {};
        // Restore state based on type
        if (record.type === 'FEED') {
          setFeedSubtype(d.subtype || 'BOTTLE');
          setAmount(d.amount || 120);
          setDuration(d.duration || 15);
        } else if (record.type === 'DIAPER') {
          setDiaperType(d.type || 'PEE');
        } else if (record.type === 'SLEEP') {
          setSleepDuration(d.duration || 60);
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
      let details: any = {};

      if (type === 'FEED') {
        if (feedSubtype === 'BOTTLE') {
          details = { subtype: 'BOTTLE', amount, unit: 'ml' };
        } else {
          details = { subtype: 'BREAST', duration };
        }
      } else if (type === 'DIAPER') {
        details = { type: diaperType };
      } else if (type === 'SLEEP') {
        details = { isNap: true, duration: sleepDuration }; // Assume Nap for quick edit, or could add toggle
      } else if (type === 'VITA_AD' || type === 'VITA_D3') {
        details = { amount: 1, unit: '粒' };
      }

      await BabyService.updateRecord(id, {
        type,
        time: time.toISOString(),
        details,
        remark,
      });
      navigate(`/record/${id}`);
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button icon="back" stylingMode="text" onClick={() => navigate(-1)} />
        <h2 style={{ fontSize: 18, margin: 0, marginLeft: 8 }}>编辑记录</h2>
      </div>

      <div className="bd-card">
        {/* Time Picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>时间</label>
          <DateBox type="datetime" value={time} onValueChanged={e => setTime(e.value)} />
        </div>

        {/* Type Specific Fields */}
        {type === 'FEED' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>喂养方式</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['BOTTLE', 'BREAST'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFeedSubtype(t as any)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: feedSubtype === t ? '2px solid #F3B6C2' : '1px solid #ddd',
                      background: feedSubtype === t ? '#F3B6C2' : '#fff',
                      color: feedSubtype === t ? '#fff' : '#6b524b',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {t === 'BOTTLE' ? '🍼 瓶喂' : '🤱 亲喂'}
                  </button>
                ))}
              </div>
            </div>

            {feedSubtype === 'BOTTLE' ? (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>奶量 (ml)</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {Array.from({ length: 19 }, (_, i) => 30 + i * 10).map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(v)}
                      style={selectionBtnStyle(amount === v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 'bold', color: '#F3B6C2' }}>Selected: {amount}ml</div>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>时长 (分钟)</label>
                <div style={quickSelectStyle}>
                  {[5, 10, 15, 20, 30, 40, 50, 60].map(v => (
                    <button key={v} onClick={() => setDuration(v)} style={selectionBtnStyle(duration === v)}>{v}</button>
                  ))}
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 'bold', color: '#F3B6C2' }}>Selected: {duration}min</div>
              </div>
            )}
          </>
        )}

        {type === 'DIAPER' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>类型</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { id: 'PEE', label: '💧 尿尿' },
                { id: 'POO', label: '💩 便便' },
                { id: 'BOTH', label: '😳 都有' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDiaperType(opt.id as any)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: diaperType === opt.id ? '2px solid #8dcece' : '1px solid #ddd',
                    background: diaperType === opt.id ? '#8dcece' : '#fff',
                    color: diaperType === opt.id ? '#fff' : '#6b524b',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'SLEEP' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>睡眠时长</label>
            <div style={quickSelectStyle}>
              {[30, 45, 60, 90, 120, 150, 180, 240].map(v => (
                <button key={v} onClick={() => setSleepDuration(v)} style={selectionBtnStyle(sleepDuration === v)}>
                  {v < 60 ? `${v}m` : `${v / 60}h`}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 'bold', color: '#97c1a9' }}>
              Selected: {sleepDuration < 60 ? `${sleepDuration}m` : `${(sleepDuration / 60).toFixed(1)}h`}
            </div>
          </div>
        )}

        {/* Remark */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>备注</label>
          <TextArea value={remark} onValueChanged={e => setRemark(e.value)} placeholder="写点什么..." height={80} />
        </div>

      </div>

      <div className="bd-fab">
        <Button
          text={saving ? '保存中...' : '保存修改'}
          type="default"
          stylingMode="contained"
          height={48}
          width="100%"
          onClick={handleSubmit}
          disabled={saving}
          elementAttr={{ style: { borderRadius: 24, fontSize: 16, fontWeight: 600, boxShadow: '0 4px 12px rgba(243, 182, 194, 0.4)' } }}
        />
      </div>
    </div>
  );
};
