import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { BabyService } from '../services/api';
import { API_URL } from '../config/env';
import { useCurrentBaby } from '../hooks/useCurrentBaby';
import { useRecords } from '../hooks/useRecords';
import { FeedTimelineChart } from '../components/mobile/FeedTimelineChart';
import type { FeedDetails, UserSettings } from '../types';

// 计算距今多长时间 - 优先使用服务器计算的值
const getTimeAgo = (date: Date, serverTimeAgo?: string): string => {
  // 如果服务器已经计算好了时间，直接使用（Kindle兼容）
  if (serverTimeAgo) return serverTimeAgo;

  // 否则使用客户端计算（非Kindle设备的后备方案）
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

// 格式化时间 - 优先使用服务器计算的值
const formatTime = (date: Date, serverFormattedTime?: string): string => {
  // 如果服务器已经计算好了时间，直接使用（Kindle兼容）
  if (serverFormattedTime) return serverFormattedTime;

  // 否则使用客户端计算（非Kindle设备的后备方案）
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 检测是否是 Kindle 模式
const isKindleMode = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.body.classList.contains('kindle-mode');
};

// 获取记录图标 - Kindle 模式下使用文字
const getRecordIcon = (type: string, subtype?: string): string => {
  const kindle = isKindleMode();
  if (type === 'FEED') {
    return kindle ? (subtype === 'BREAST' ? '母' : '奶') : (subtype === 'BREAST' ? '🤱' : '🍼');
  }
  if (type === 'SLEEP') return kindle ? '睡' : '💤';
  if (type === 'DIAPER') return kindle ? '尿' : '🧷';
  if (type === 'VITA_AD') return kindle ? 'AD' : '💊';
  if (type === 'VITA_D3') return kindle ? 'D3' : '☀️';
  if (type === 'BATH') return kindle ? '浴' : '🛁';
  if (type === 'HEALTH') return kindle ? '健' : '🏥';
  if (type === 'GROWTH') return kindle ? '长' : '📏';
  if (type === 'MILESTONE') return kindle ? '碑' : '🎉';
  return kindle ? '记' : '📝';
};

// 获取记录类型名称
const getRecordTypeName = (type: string, subtype?: string): string => {
  if (type === 'FEED') {
    return subtype === 'BREAST' ? '亲喂' : '瓶喂';
  }
  if (type === 'SLEEP') return '睡眠';
  if (type === 'DIAPER') return '换尿布';
  if (type === 'VITA_AD') return '维生素 AD';
  if (type === 'VITA_D3') return '维生素 D3';
  if (type === 'BATH') return '洗澡';
  if (type === 'HEALTH') return '健康';
  if (type === 'GROWTH') return '成长';
  if (type === 'MILESTONE') return '里程碑';
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
  if (record.type === 'VITA_AD' || record.type === 'VITA_D3') {
    const amount = record.details?.amount || 1;
    const unit = record.details?.unit || '粒';
    return `${amount}${unit}`;
  }
  if (record.type === 'DIAPER') {
    const diaperType = record.details?.type;
    if (diaperType === 'BOTH') return '尿 + 便';
    if (diaperType === 'POO') return '便便';
    return '尿尿';
  }
  return record.remark || '—';
};

// 获取卡片动态背景色
const getCardBackground = (elapsedTimeMs: number): string => {
  const hours = elapsedTimeMs / (1000 * 60 * 60);
  const maxHours = 5;
  const percentage = Math.min((hours / maxHours) * 100, 100);

  // 动态计算末端颜色 (Tip Color)
  // 随着时间推移，末端颜色变得更红更深
  const progressRatio = Math.min(hours / maxHours, 1);
  const lightness = 95 - (progressRatio * 40); // 95% -> 55%
  const saturation = 50 + (progressRatio * 40); // 50% -> 90%
  const tipColor = `hsl(350, ${saturation}%, ${lightness}%)`;

  // 渐变: 起点(极淡粉) ->此处(动态深红) -> 之后(白/透明)
  return `linear-gradient(90deg, #fff5f5 0%, ${tipColor} ${percentage}%, #ffffff ${percentage}%)`;
};

export const MobileHome = () => {
  const { baby, loading: babyLoading, error: babyError } = useCurrentBaby();
  const { records, loading: recordsLoading, error: recordsError } = useRecords(baby?.id || null, 5, 0);
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryError, setSummaryError] = useState<string | undefined>();
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState({ visible: false, type: 'VITA_AD' as 'VITA_AD' | 'VITA_D3' });
  const [settings, setSettings] = useState<UserSettings | null>(null);

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

  // 加载用户设置
  useEffect(() => {
    BabyService.getSettings().then(setSettings).catch(() => { });
  }, []);

  // 查找最近一次喂奶记录
  const lastFeedRecord = records.find(r => r.type === 'FEED');

  // 今日统计
  const todayMilk = summary?.milkMl ?? 0;
  const todaySleepMins = summary?.sleepMinutes ?? 0;
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

  // 计算出生天数
  const bornDays = baby?.birthday ? Math.floor((today.getTime() - new Date(baby.birthday).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <>
      {/* 页面标题 */}
      <header className="bd-minimal-header animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {baby?.avatarUrl ? (
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <img
              src={baby.avatarUrl.startsWith('http') ? baby.avatarUrl : `${API_URL}${baby.avatarUrl}`}
              alt={baby.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F7EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            👶
          </div>
        )}

        <div>
          <h1 style={{ fontSize: 22, margin: 0, lineHeight: 1.2 }}>{baby?.name || '宝宝'} 的今日概览</h1>
          <div className="date" style={{ marginTop: 2, fontSize: 13, opacity: 0.8 }}>
            <time dateTime={today.toISOString()}>{dateStr}</time>
            {bornDays > 0 && <span style={{ marginLeft: 8 }}>出生 {bornDays} 天</span>}
          </div>
        </div>
      </header>

      {/* 上次喂奶提醒卡片 */}
      {lastFeedRecord ? (() => {
        const feedDetails = lastFeedRecord.details as FeedDetails;
        // 优先使用服务器计算的时间差（Kindle兼容）
        const elapsedTimeMs = (lastFeedRecord as any).elapsedMs ?? (new Date().getTime() - new Date(lastFeedRecord.time).getTime());
        return (
          <div
            className="bd-last-feed-card animate-slide-up delay-1"
            style={{
              background: getCardBackground(elapsedTimeMs),
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            {/* 循环动画遮罩 (限制在进度条区域内) - Kindle模式下禁用 */}
            {!isKindleMode() && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${Math.min((elapsedTimeMs / (5 * 60 * 60 * 1000)) * 100, 100)}%`,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
                pointerEvents: 'none',
                zIndex: 1
              }} />
            )}
            {!isKindleMode() && (
              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            )}
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
              {isKindleMode()
                ? `${formatTime(new Date(lastFeedRecord.time), (lastFeedRecord as any).formattedTime)} (${getTimeAgo(new Date(lastFeedRecord.time), (lastFeedRecord as any).timeAgo)})`
                : getTimeAgo(new Date(lastFeedRecord.time), (lastFeedRecord as any).timeAgo)
              }
            </div>
            {/* 进度提示文本 */}
            <div className="time-detail" style={{ marginTop: 8 }}>
              {formatTime(new Date(lastFeedRecord.time), (lastFeedRecord as any).formattedTime)} 喂奶 · {getRecordTypeName('FEED', feedDetails?.subtype)}
            </div>
          </div>
        );
      })() : (
        <div className="bd-last-feed-card animate-slide-up delay-1">
          <div className="label">暂无喂奶记录</div>
          <div className="main-info">
            <span className="amount">— ml</span>
          </div>
          <div className="time-detail">点击下方按钮开始记录</div>
        </div>
      )}

      {/* 今日喂奶时间线 */}
      {baby?.id && (
        <section className="animate-slide-up delay-2" aria-label="喂奶时间线">
          <FeedTimelineChart babyId={baby.id} dayStartHour={settings?.dayStartHour || 0} />
        </section>
      )}

      {/* 今日统计 */}
      <section className="bd-today-stats animate-slide-up delay-2" aria-label="今日数据统计">
        <div className="bd-stat-card feed">
          <div className="icon">{isKindleMode() ? '奶' : '🍼'}</div>
          <div className="title">今日奶量</div>
          <div className="value">{todayMilk}<span className="unit"> ml</span></div>
        </div>
        <div className="bd-stat-card sleep">
          <div className="icon">{isKindleMode() ? '睡' : '💤'}</div>
          <div className="title">今日睡眠</div>
          <div className="value">
            {sleepHours}<span className="unit">h</span> {sleepMins}<span className="unit">m</span>
          </div>
        </div>
      </section>

      {/* 快捷操作按钮 */}
      <div className="bd-actions animate-slide-up delay-3">
        <button className="bd-action-btn feed" onClick={() => setShowFeedModal(true)}>
          <span className="icon">{isKindleMode() ? '奶' : '🍼'}</span>
          <span className="text">记录喂奶</span>
          <span className="sub-text">瓶喂 / 亲喂</span>
        </button>
        <button className="bd-action-btn sleep" onClick={() => setShowSleepModal(true)}>
          <span className="icon">{isKindleMode() ? '睡' : '💤'}</span>
          <span className="text">记录睡眠</span>
          <span className="sub-text">开始 / 结束</span>
        </button>
        <button className="bd-action-btn supplement" onClick={() => setShowSupplementModal({ visible: true, type: 'VITA_AD' })}>
          <span className="icon">{isKindleMode() ? 'AD' : '💊'}</span>
          <span className="text">AD</span>
          <span className="sub-text">每日一粒</span>
        </button>
        <button className="bd-action-btn supplement" onClick={() => setShowSupplementModal({ visible: true, type: 'VITA_D3' })}>
          <span className="icon">{isKindleMode() ? 'D3' : '☀️'}</span>
          <span className="text">D3</span>
          <span className="sub-text">每日一粒</span>
        </button>
      </div>

      {/* 最近记录列表 */}
      <section className="bd-recent-list animate-slide-up delay-4" aria-label="最近活动记录">
        <div className="title">
          <h2 style={{ fontSize: 15, margin: 0 }}>最近记录</h2>
          <Link to="/records" style={{ fontSize: 12, color: 'var(--rose)' }}>查看全部 →</Link>
        </div>
        {records.length === 0 ? (
          <p style={{ color: '#8b7670', textAlign: 'center', padding: 20 }}>
            目前还没有任何活动记录。
          </p>
        ) : (
          <ul className="records-container" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {records.slice(0, 3).map(record => {
              const recordDetails = record.details as any;
              return (
                <li key={record.id} className="bd-record-item">
                  <div className={`icon-wrap ${record.type === 'FEED' ? 'feed' : record.type === 'SLEEP' ? 'sleep' : 'feed'}`}>
                    {getRecordIcon(record.type, recordDetails?.subtype)}
                  </div>
                  <div className="info">
                    <p className="type" style={{ margin: 0, fontWeight: 500 }}>{getRecordTypeName(record.type, recordDetails?.subtype)}</p>
                    <p className="time" style={{ margin: 0, fontSize: 12, color: '#8b7670' }}>记录于 {formatTime(new Date(record.time), (record as any).formattedTime)}</p>
                  </div>
                  <div className="value" style={{ fontWeight: 600 }}>{formatRecordValue(record)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 阅读器/文章模式专用内容块 - 对视觉用户隐藏，但结构对阅读器友好 */}
      <div id="reader-summary">
        <article>
          <h1>{baby?.name || '宝宝'}的日常总结</h1>
          <p>
            今天是 <time>{dateStr}</time>。
            {baby?.name || '宝宝'}已经出生 {bornDays} 天了。
          </p>

          <h2>今日数据统计</h2>
          <p>
            在喂养方面，今天总共摄入奶量 {todayMilk} 毫升。
            在睡眠方面，今天总共睡眠 {sleepHours} 小时 {sleepMins} 分钟。
          </p>

          <h2>最近的活动记录</h2>
          {records.length > 0 ? (
            records.slice(0, 10).map((record, index) => {
              const details = record.details as any;
              const typeName = getRecordTypeName(record.type, details?.subtype);
              const timeStr = new Date(record.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const valueStr = formatRecordValue(record);
              return (
                <p key={index}>
                  <strong>{timeStr}</strong> - {typeName}: {valueStr}
                </p>
              );
            })
          ) : (
            <p>今天还没有任何记录。</p>
          )}
        </article>
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

      {/* 补充剂记录弹窗 */}
      {showSupplementModal.visible && (
        <SupplementModal
          babyId={baby?.id || ''}
          type={showSupplementModal.type}
          onClose={() => setShowSupplementModal({ ...showSupplementModal, visible: false })}
          onSuccess={() => {
            setShowSupplementModal({ ...showSupplementModal, visible: false });
            window.location.reload();
          }}
        />
      )}
    </>
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
        babyId: babyId,
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
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8b7670', marginBottom: 16, textAlign: 'center' }}>
              奶量 (ml)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              maxHeight: '240px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {Array.from({ length: 19 }, (_, i) => 30 + i * 10).map(volume => (
                <button
                  key={volume}
                  type="button"
                  onClick={() => setAmount(volume)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: amount === volume ? '2px solid #F3B6C2' : '2px solid #e5e5e5',
                    background: amount === volume ? '#F3B6C2' : '#fff',
                    color: amount === volume ? '#fff' : '#6b524b',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {volume}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#8b7670' }}>
              Selected: <span style={{ fontWeight: 'bold', color: '#4A342E', fontSize: 16 }}>{amount} ml</span>
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
        babyId: babyId,
        time: new Date().toISOString(),
        details: { isNap: true, duration }
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
// 补充剂记录弹窗
const SupplementModal = ({ babyId, type, onClose, onSuccess }: { babyId: string; type: 'VITA_AD' | 'VITA_D3'; onClose: () => void; onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [remark, setRemark] = useState(''); // Reserve for future remark support

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await BabyService.createRecord({
        type: type,
        babyId: babyId,
        time: new Date().toISOString(),
        details: { amount: 1, unit: '粒' },
        // remark: remark || undefined
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === 'VITA_AD' ? '维生素 AD' : '维生素 D3';
  const color = type === 'VITA_AD' ? '#A2D2FF' : '#FFC8A2';

  return (
    <div className="bd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bd-modal-sheet">
        <div className="bd-modal-handle" />
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>💊 记录 {title}</h2>

        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{type === 'VITA_AD' ? '💊' : '☀️'}</div>
          <p style={{ color: '#8b7670' }}>今日打卡 1 粒</p>
        </div>

        <button
          className="bd-submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 16,
            background: color,
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 10
          }}
        >
          {isSubmitting ? '保存中...' : '✓ 确认打卡'}
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
