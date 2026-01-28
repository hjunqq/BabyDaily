import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { BabyService } from '../services/api';
import { useCurrentBaby } from '../hooks/useCurrentBaby';
import { useRecords } from '../hooks/useRecords';
import type { FeedDetails } from '../types';

// 计算距今多长时间
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}小时${mins}分钟前` : `${hours}小时前`;
  }

  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 获取记录图标
const getRecordIcon = (type: string, subtype?: string): string => {
  if (type === 'FEED') {
    return subtype === 'BREAST' ? '🤱' : '🍼';
  }
  if (type === 'SLEEP') return '💤';
  if (type === 'DIAPER') return '🧷';
  return '📝';
};

// 获取记录类型名称
const getRecordTypeName = (type: string, subtype?: string): string => {
  if (type === 'FEED') {
    return subtype === 'BREAST' ? '亲喂' : '瓶喂';
  }
  if (type === 'SLEEP') return '睡眠';
  if (type === 'DIAPER') return '换尿布';
  return '记录';
};

// 格式化记录值
const formatRecordValue = (record: any): string => {
  if (record.type === 'FEED') {
    if (record.details?.subtype === 'BREAST') {
      return `${record.details?.duration || 0} 分钟`;
    }
    return `${record.details?.amount || 0} ml`;
  }
  if (record.type === 'SLEEP') {
    const mins = record.details?.duration || 0;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return hours > 0 ? `${hours}h ${remainMins}m` : `${mins}m`;
  }
  return record.remark || '—';
};

export const MobileHome = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const { records, loading: recordsLoading, error: recordsError } = useRecords(baby?.id || null, 5, 0);
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryError, setSummaryError] = useState<string | undefined>();
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!baby?.id) return;
      try {
        const data = await BabyService.getSummary(baby.id, 1);
        setSummary(data);
        setSummaryError(undefined);
      } catch (err: any) {
        setSummaryError(err?.message || '获取统计失败');
      }
    };
    load();
  }, [baby?.id]);

  // 查找最近一次喂奶记录
  const lastFeedRecord = records.find(r => r.type === 'FEED');

  // 今日统计
  const todayMilk = summary?.milk_ml ?? 0;
  const todaySleepMins = summary?.sleep_minutes ?? 0;
  const sleepHours = Math.floor(todaySleepMins / 60);
  const sleepMins = todaySleepMins % 60;

  // 加载状态
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

  // 错误状态
  if (babyError || recordsError || summaryError) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{babyError || recordsError || summaryError}</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div>
      {/* 页面标题 */}
      <div className="bd-minimal-header">
        <h1>🍼 宝宝日常</h1>
        <div className="date">{dateStr}</div>
      </div>

      {/* 上次喂奶提醒卡片 */}
      {lastFeedRecord ? (() => {
        const feedDetails = lastFeedRecord.details as FeedDetails;
        return (
          <div className="bd-last-feed-card">
            <div className="label">距离上次喂奶</div>
            <div className="main-info">
              <span className="amount">
                {feedDetails?.subtype === 'BREAST'
                  ? `${feedDetails?.duration || 0} 分钟`
                  : `${feedDetails?.amount || 0} ml`
                }
              </span>
              <span className="type-tag">
                {feedDetails?.subtype === 'BREAST' ? '亲喂' : '瓶喂'}
              </span>
            </div>
            <div className="time-ago">
              ⏰ {getTimeAgo(new Date(lastFeedRecord.time))}
            </div>
            <div className="time-detail">
              {formatTime(new Date(lastFeedRecord.time))} 喂奶 · {getRecordTypeName('FEED', feedDetails?.subtype)}
            </div>
          </div>
        );
      })() : (
        <div className="bd-last-feed-card">
          <div className="label">暂无喂奶记录</div>
          <div className="main-info">
            <span className="amount">— ml</span>
          </div>
          <div className="time-detail">点击下方按钮开始记录</div>
        </div>
      )}

      {/* 今日统计 */}
      <div className="bd-today-stats">
        <div className="bd-stat-card feed">
          <div className="icon">🍼</div>
          <div className="title">今日奶量</div>
          <div className="value">{todayMilk}<span className="unit"> ml</span></div>
        </div>
        <div className="bd-stat-card sleep">
          <div className="icon">💤</div>
          <div className="title">今日睡眠</div>
          <div className="value">
            {sleepHours}<span className="unit">h</span> {sleepMins}<span className="unit">m</span>
          </div>
        </div>
      </div>

      {/* 快捷操作按钮 */}
      <div className="bd-actions">
        <button className="bd-action-btn feed" onClick={() => setShowFeedModal(true)}>
          <span className="icon">🍼</span>
          <span className="text">记录喂奶</span>
          <span className="sub-text">瓶喂 / 亲喂</span>
        </button>
        <button className="bd-action-btn sleep" onClick={() => setShowSleepModal(true)}>
          <span className="icon">💤</span>
          <span className="text">记录睡眠</span>
          <span className="sub-text">开始 / 结束</span>
        </button>
      </div>

      {/* 最近记录列表 */}
      <div className="bd-recent-list">
        <div className="title">
          <span>最近记录</span>
          <Link to="/mobile/records">查看全部 →</Link>
        </div>
        {records.length === 0 ? (
          <div style={{ color: '#8b7670', textAlign: 'center', padding: 20 }}>
            暂无记录，快去添加第一条吧~
          </div>
        ) : (
          records.slice(0, 4).map(record => {
            const recordDetails = record.details as any;
            return (
              <div key={record.id} className="bd-record-item">
                <div className={`icon-wrap ${record.type === 'FEED' ? 'feed' : record.type === 'SLEEP' ? 'sleep' : 'feed'}`}>
                  {getRecordIcon(record.type, recordDetails?.subtype)}
                </div>
                <div className="info">
                  <div className="type">{getRecordTypeName(record.type, recordDetails?.subtype)}</div>
                  <div className="time">{formatTime(new Date(record.time))}</div>
                </div>
                <div className="value">{formatRecordValue(record)}</div>
              </div>
            );
          })
        )}
      </div>

      {/* 喂奶记录弹窗 */}
      {showFeedModal && (
        <FeedModal
          babyId={baby?.id || ''}
          onClose={() => setShowFeedModal(false)}
          onSuccess={() => {
            setShowFeedModal(false);
            window.location.reload(); // 简单刷新
          }}
        />
      )}

      {/* 睡眠记录弹窗 */}
      {showSleepModal && (
        <SleepModal
          babyId={baby?.id || ''}
          onClose={() => setShowSleepModal(false)}
          onSuccess={() => {
            setShowSleepModal(false);
            window.location.reload(); // 简单刷新
          }}
        />
      )}
    </div>
  );
};

// 喂奶记录弹窗组件
const FeedModal = ({ babyId, onClose, onSuccess }: { babyId: string; onClose: () => void; onSuccess: () => void }) => {
  const [feedType, setFeedType] = useState<'BOTTLE' | 'BREAST'>('BOTTLE');
  const [amount, setAmount] = useState(120);
  const [duration, setDuration] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await BabyService.createRecord({
        type: 'FEED',
        baby_id: babyId,
        time: new Date().toISOString(),
        details: feedType === 'BOTTLE'
          ? { subtype: 'BOTTLE', amount, unit: 'ml' }
          : { subtype: 'BREAST', duration }
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bd-modal-sheet">
        <div className="bd-modal-handle" />
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>🍼 记录喂奶</h2>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>喂养方式</label>
          <div className="bd-quick-select">
            <button className={feedType === 'BOTTLE' ? 'active' : ''} onClick={() => setFeedType('BOTTLE')}>瓶喂</button>
            <button className={feedType === 'BREAST' ? 'active' : ''} onClick={() => setFeedType('BREAST')}>亲喂</button>
          </div>
        </div>

        {feedType === 'BOTTLE' ? (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>奶量 (ml)</label>
            <div className="bd-quick-select">
              {[60, 90, 120, 150, 180].map(v => (
                <button key={v} className={amount === v ? 'active' : ''} onClick={() => setAmount(v)}>{v}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>亲喂时长 (分钟)</label>
            <div className="bd-quick-select">
              {[5, 10, 15, 20, 30].map(v => (
                <button key={v} className={duration === v ? 'active' : ''} onClick={() => setDuration(v)}>{v}</button>
              ))}
            </div>
          </div>
        )}

        <button
          className="bd-submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 16,
            background: '#F3B6C2',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 10
          }}
        >
          {isSubmitting ? '保存中...' : '✓ 保存记录'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 14,
            background: 'transparent',
            color: '#8b7670',
            border: 'none',
            fontSize: 15,
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};

// 睡眠记录弹窗组件
const SleepModal = ({ babyId, onClose, onSuccess }: { babyId: string; onClose: () => void; onSuccess: () => void }) => {
  const [duration, setDuration] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await BabyService.createRecord({
        type: 'SLEEP',
        baby_id: babyId,
        time: new Date().toISOString(),
        details: { is_nap: true, duration }
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bd-modal-sheet">
        <div className="bd-modal-handle" />
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>💤 记录睡眠</h2>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 8 }}>睡眠时长 (分钟)</label>
          <div className="bd-quick-select">
            {[30, 60, 90, 120, 180].map(v => (
              <button key={v} className={duration === v ? 'active' : ''} onClick={() => setDuration(v)}>
                {v >= 60 ? `${v / 60}h` : `${v}m`}
              </button>
            ))}
          </div>
        </div>

        <button
          className="bd-submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 16,
            background: '#BFD9C6',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 10
          }}
        >
          {isSubmitting ? '保存中...' : '✓ 保存记录'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 14,
            background: 'transparent',
            color: '#8b7670',
            border: 'none',
            fontSize: 15,
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};
