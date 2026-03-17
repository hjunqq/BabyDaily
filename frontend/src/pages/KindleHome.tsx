import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BabyService } from '../services/api';
import { createRecordOfflineAware, flushQueue, getQueueLength } from '../services/kindleOfflineQueue';

// ── Inline styles (no external CSS dependency) ──────────────────────────

const S = {
  page: {
    fontFamily: 'Georgia, "Noto Serif SC", serif',
    background: '#fff',
    color: '#000',
    padding: '10px 14px',
    height: '100vh',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '2px',
    fontSize: '14px',
    color: '#666',
  },
  summary: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    margin: '0 0 10px 0',
    borderBottom: '1px solid #000',
    paddingBottom: '6px',
  },
  giantBtn: {
    width: '100%',
    padding: '16px 14px',
    border: '3px solid #000',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '22px',
    fontWeight: 'bold' as const,
    fontFamily: 'Georgia, "Noto Serif SC", serif',
    cursor: 'pointer',
    textAlign: 'left' as const,
    marginBottom: '10px',
    position: 'relative' as const,
  },
  giantSub: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 'normal' as const,
    marginTop: '2px',
  },
  row: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  actionBtn: {
    flex: 1,
    padding: '14px 6px',
    border: '2px solid #000',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    fontFamily: 'Georgia, "Noto Serif SC", serif',
    cursor: 'pointer',
    textAlign: 'center' as const,
    minHeight: '48px',
  },
  disabledBtn: {
    opacity: 0.4,
    borderStyle: 'dashed' as const,
  },
  adjusterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '10px',
    fontSize: '16px',
  },
  adjusterBtn: {
    padding: '8px 16px',
    border: '2px solid #000',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    fontFamily: 'Georgia, "Noto Serif SC", serif',
    cursor: 'pointer',
    minWidth: '60px',
    textAlign: 'center' as const,
  },
  recentSection: {
    flex: 1,
    borderTop: '1px solid #000',
    paddingTop: '6px',
    fontSize: '14px',
    lineHeight: '1.6',
    overflow: 'hidden',
  },
  recentTitle: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '2px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #ccc',
    paddingTop: '6px',
    fontSize: '13px',
    color: '#666',
  },
  refreshBtn: {
    padding: '6px 16px',
    border: '1px solid #000',
    borderRadius: '4px',
    background: '#fff',
    fontSize: '14px',
    fontFamily: 'Georgia, "Noto Serif SC", serif',
    cursor: 'pointer',
  },
  undoBtn: {
    marginLeft: '8px',
    padding: '2px 8px',
    border: '1px solid #000',
    borderRadius: '4px',
    background: '#fff',
    fontSize: '13px',
    fontFamily: 'Georgia, "Noto Serif SC", serif',
    cursor: 'pointer',
    textDecoration: 'underline' as const,
  },
  confirmText: {
    color: '#000',
    fontWeight: 'bold' as const,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    fontFamily: 'Georgia, "Noto Serif SC", serif',
  },
  error: {
    padding: '20px',
    fontSize: '16px',
    fontFamily: 'Georgia, "Noto Serif SC", serif',
  },
};

// ── Types ────────────────────────────────────────────────────────────────

interface KindleSummary {
  summaryLine: string;
  lastFeedAmount: number;
  lastFeedTime?: string;
  lastFeedTimeAgo?: string;
  lastFeedSubtype: string;
  milkMl: number;
  feedCount: number;
  todayAdTaken: boolean;
  todayD3Taken: boolean;
  recentLines: string[];
  lastPeeTimeAgo: string;
  lastPooTimeAgo: string;
  lastBathTimeAgo: string;
}

type ActionId = 'feed' | 'pee' | 'poo' | 'both' | 'bath' | 'ad' | 'd3';

interface ActionState {
  confirmed: boolean;
  text: string;
  recordId?: string;
  timer?: ReturnType<typeof setTimeout>;
}

const FEED_AMOUNT_KEY = 'kindle_last_feed_ml';

// ── Component ────────────────────────────────────────────────────────────

export const KindleHome: React.FC = () => {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [summary, setSummary] = useState<KindleSummary | null>(null);
  const [feedAmount, setFeedAmount] = useState(() => {
    const saved = localStorage.getItem(FEED_AMOUNT_KEY);
    return saved ? parseInt(saved, 10) || 150 : 150;
  });
  const [queueLen, setQueueLen] = useState(getQueueLength);
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Use ref for undo timers to avoid re-render issues
  const undoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadData = useCallback(async () => {
    try {
      const data = await BabyService.getKindleSummary();
      setSummary(data);
      // Sync feed amount from server if available
      if (data.lastFeedAmount && !localStorage.getItem(FEED_AMOUNT_KEY)) {
        setFeedAmount(data.lastFeedAmount);
      }
      setPhase('ready');
    } catch (err: any) {
      setErrorMsg(err?.message || '加载失败');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    loadData();
    // Flush offline queue on mount
    flushQueue().then(() => setQueueLen(getQueueLength()));
    // Listen for online event
    const onOnline = () => {
      flushQueue().then(() => setQueueLen(getQueueLength()));
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await flushQueue().catch(() => {});
    setQueueLen(getQueueLength());
    await loadData();
    setRefreshing(false);
  };

  const performAction = async (actionId: ActionId, payload: any, confirmText: string) => {
    // Clear any existing undo timer for this action
    if (undoTimers.current[actionId]) {
      clearTimeout(undoTimers.current[actionId]);
    }

    // Immediately submit
    const result = await createRecordOfflineAware(payload);
    setQueueLen(getQueueLength());

    // Show confirmation with undo option
    setActions(prev => ({
      ...prev,
      [actionId]: { confirmed: true, text: confirmText, recordId: result.recordId },
    }));

    // Auto-clear after 5 seconds
    undoTimers.current[actionId] = setTimeout(() => {
      setActions(prev => {
        const next = { ...prev };
        delete next[actionId];
        return next;
      });
    }, 5000);
  };

  const handleUndo = async (actionId: ActionId) => {
    const action = actions[actionId];
    if (!action) return;

    if (undoTimers.current[actionId]) {
      clearTimeout(undoTimers.current[actionId]);
    }

    if (action.recordId) {
      try {
        await BabyService.deleteRecord(action.recordId);
      } catch { /* ignore - might be offline record */ }
    }

    setActions(prev => {
      const next = { ...prev };
      delete next[actionId];
      return next;
    });

    // Refresh to get updated data
    loadData();
  };

  const handleFeed = () => {
    localStorage.setItem(FEED_AMOUNT_KEY, String(feedAmount));
    performAction('feed', {
      type: 'FEED',
      time: new Date().toISOString(),
      details: { subtype: 'BOTTLE', amount: feedAmount },
    }, `已记录 ${feedAmount}ml`);
  };

  const handleDiaper = (diaperType: 'PEE' | 'POO' | 'BOTH') => {
    const names = { PEE: '尿尿', POO: '便便', BOTH: '混合' };
    const id = diaperType.toLowerCase() as ActionId;
    performAction(id, {
      type: 'DIAPER',
      time: new Date().toISOString(),
      details: { type: diaperType },
    }, `已记录${names[diaperType]}`);
  };

  const handleBath = () => {
    performAction('bath', {
      type: 'BATH',
      time: new Date().toISOString(),
      details: {},
    }, '已记录洗澡');
  };

  const handleSupplement = (type: 'VITA_AD' | 'VITA_D3') => {
    const id = type === 'VITA_AD' ? 'ad' : 'd3';
    const name = type === 'VITA_AD' ? 'AD' : 'D3';
    performAction(id as ActionId, {
      type,
      time: new Date().toISOString(),
      details: {},
    }, `已记录${name}`);
  };

  const adjustAmount = (delta: number) => {
    setFeedAmount(prev => {
      const next = Math.max(10, Math.min(500, prev + delta));
      localStorage.setItem(FEED_AMOUNT_KEY, String(next));
      return next;
    });
  };

  // ── Render helpers ──

  const renderActionBtn = (
    actionId: ActionId,
    label: string,
    onClick: () => void,
    disabled = false
  ) => {
    const action = actions[actionId];
    if (action?.confirmed) {
      return (
        <button
          key={actionId}
          style={{ ...S.actionBtn, borderColor: '#060' }}
          onClick={() => handleUndo(actionId)}
        >
          <span style={S.confirmText}>{action.text}</span>
          <span style={S.undoBtn}>撤销</span>
        </button>
      );
    }
    return (
      <button
        key={actionId}
        style={{ ...S.actionBtn, ...(disabled ? S.disabledBtn : {}) }}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {label}
      </button>
    );
  };

  // ── Loading / Error ──

  if (phase === 'loading') {
    return <div style={S.loading}>加载中...</div>;
  }

  if (phase === 'error') {
    return (
      <div style={S.error}>
        <p>加载失败: {errorMsg}</p>
        <button style={S.refreshBtn} onClick={() => { setPhase('loading'); loadData(); }}>
          重试
        </button>
      </div>
    );
  }

  // ── Main Render ──

  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai'
  });

  const feedAction = actions['feed'];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <span>宝宝日常</span>
        <span>{timeStr}</span>
      </div>

      {/* Summary line */}
      <div style={S.summary}>{summary?.summaryLine || '今日: 0ml / 0次喂奶'}</div>

      {/* Giant feed button */}
      {feedAction?.confirmed ? (
        <button style={{ ...S.giantBtn, borderColor: '#060' }} onClick={() => handleUndo('feed')}>
          <span style={S.confirmText}>{feedAction.text}</span>
          <span style={S.undoBtn}>撤销</span>
        </button>
      ) : (
        <button style={S.giantBtn} onClick={handleFeed}>
          <div>喂奶 {feedAmount}ml</div>
          <div style={S.giantSub}>
            {summary?.lastFeedTime ? `上次 ${summary.lastFeedTime} (${summary.lastFeedTimeAgo})` : '暂无记录'}
          </div>
        </button>
      )}

      {/* Diaper row */}
      <div style={S.row}>
        {renderActionBtn('pee', '尿尿', () => handleDiaper('PEE'))}
        {renderActionBtn('poo', '便便', () => handleDiaper('POO'))}
        {renderActionBtn('both', '混合', () => handleDiaper('BOTH'))}
      </div>

      {/* Other actions row */}
      <div style={S.row}>
        {renderActionBtn('bath', '洗澡', handleBath)}
        {renderActionBtn('ad', summary?.todayAdTaken ? 'AD (已服)' : 'AD', () => handleSupplement('VITA_AD'), summary?.todayAdTaken)}
        {renderActionBtn('d3', summary?.todayD3Taken ? 'D3 (已服)' : 'D3', () => handleSupplement('VITA_D3'), summary?.todayD3Taken)}
      </div>

      {/* Amount adjuster */}
      <div style={S.adjusterRow}>
        <button style={S.adjusterBtn} onClick={() => adjustAmount(-10)}>-10ml</button>
        <span style={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'center' }}>
          {feedAmount}ml
        </span>
        <button style={S.adjusterBtn} onClick={() => adjustAmount(10)}>+10ml</button>
      </div>

      {/* Recent records */}
      <div style={S.recentSection}>
        <div style={S.recentTitle}>最近记录</div>
        {summary?.recentLines?.length ? (
          summary.recentLines.map((line, i) => <div key={i}>{line}</div>)
        ) : (
          <div style={{ color: '#999' }}>暂无记录</div>
        )}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <button style={S.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '刷新中...' : '刷新'}
        </button>
        <span>
          {queueLen > 0 ? `离线队列: ${queueLen}` : (navigator.onLine ? '' : '离线')}
        </span>
      </div>
    </div>
  );
};
