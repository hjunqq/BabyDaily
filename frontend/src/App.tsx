import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { MobileLayout } from './layouts/MobileLayout';
import { useIsMobile } from './hooks/useIsMobile';
import { BabyService } from './services/api';
import { API_URL } from './config/env';
import { LoadIndicator } from 'devextreme-react/load-indicator';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MobileHome } from './pages/MobileHome';


import { OotdDesktop } from './pages/desktop/OotdDesktop';
import { OotdMobile } from './pages/mobile/OotdMobile';
import { RecordsDesktop } from './pages/desktop/RecordsDesktop';
import { RecordDesktop } from './pages/desktop/RecordDesktop';
import { RecordDetailDesktop } from './pages/desktop/RecordDetailDesktop';
import { RecordEditDesktop } from './pages/desktop/RecordEditDesktop';
import { StatisticsDesktop } from './pages/desktop/StatisticsDesktop';
import { ProfileDesktop } from './pages/desktop/ProfileDesktop';
import { FamilyDesktop } from './pages/desktop/FamilyDesktop';
import { BabyProfileDesktop } from './pages/desktop/BabyProfileDesktop';
import { SettingsDesktop } from './pages/desktop/SettingsDesktop';
import { NotificationsDesktop } from './pages/desktop/NotificationsDesktop';
import { ApiTestDesktop } from './pages/desktop/ApiTestDesktop';

import { RecordsMobile } from './pages/mobile/RecordsMobile';
import { RecordMobile } from './pages/mobile/RecordMobile';
import { RecordDetailMobile } from './pages/mobile/RecordDetailMobile';
import { RecordEditMobile } from './pages/mobile/RecordEditMobile';
import { StatisticsMobile } from './pages/mobile/StatisticsMobile';
import { ProfileMobile } from './pages/mobile/ProfileMobile';
import { FamilyMobile } from './pages/mobile/FamilyMobile';
import { BabyProfileMobile } from './pages/mobile/BabyProfileMobile';
import { SettingsMobile } from './pages/mobile/SettingsMobile';
import { NotificationsMobile } from './pages/mobile/NotificationsMobile';
import { ApiTestMobile } from './pages/mobile/ApiTestMobile';
import { OnboardingMobile } from './pages/mobile/OnboardingMobile';

import { EmptyStatePage } from './pages/states/EmptyStatePage';
import { ErrorStatePage } from './pages/states/ErrorStatePage';
import { LoadingStatePage } from './pages/states/LoadingStatePage';
import { SkeletonStatePage } from './pages/states/SkeletonStatePage';
import { NotFoundPage } from './pages/states/NotFoundPage';
import { ServerErrorPage } from './pages/states/ServerErrorPage';

const ACCESS_PIN = String((import.meta as any).env?.VITE_ACCESS_PIN || '').trim();
const PIN_STORAGE_KEY = 'bd_pin_verified';
const KINDLE_BOOTSTRAP_KEY = 'bd_kindle_bootstrap_done';

const ResponsivePage = ({ desktop, mobile }: { desktop: React.ReactElement; mobile: React.ReactElement }) => {
  const isMobile = useIsMobile();
  if (isMobile === null) return null;
  return isMobile ? mobile : desktop;
};

const RequireAuth = ({ children, allowOnboarding = false }: { children: React.ReactElement; allowOnboarding?: boolean }) => {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const isKindleUA = /Kindle|Silk/i.test(navigator.userAgent || '');
        const kindleBootstrapDone = sessionStorage.getItem(KINDLE_BOOTSTRAP_KEY) === '1';
        if (isKindleUA && !kindleBootstrapDone) {
          // Kindle/Silk may keep stale local storage aggressively; force a clean auth bootstrap once per tab session.
          BabyService.logout();
          sessionStorage.setItem(KINDLE_BOOTSTRAP_KEY, '1');
        }

        const session = await BabyService.bootstrap();
        if (!cancelled) {
          setReady(true);
          setError(null);
          setOnboardingRequired(!!session.onboardingRequired);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('自动登录失败:', err);
          setError(err?.message || '登录失败');
          setReady(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [retrySeed]);

  if (ready) {
    if (onboardingRequired && !allowOnboarding) {
      return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
    }

    if (!onboardingRequired && allowOnboarding) {
      return <Navigate to="/" replace />;
    }
  }

  if (error) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>连接失败</h3>
          <p style={{ color: '#6b524b' }}>{error}</p>
          <button
            onClick={() => { setError(null); setReady(false); setRetrySeed(v => v + 1); }}
            style={{ marginTop: 16, padding: '8px 24px', background: '#F3B6C2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  return children;
};

const PinGate = ({ children }: { children: React.ReactNode }) => {
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ACCESS_PIN) {
      setVerified(true);
      return;
    }
    if (localStorage.getItem(PIN_STORAGE_KEY) === '1') {
      setVerified(true);
    }
  }, []);

  if (!ACCESS_PIN || verified) {
    return children;
  }

  const submitPin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin === ACCESS_PIN) {
      localStorage.setItem(PIN_STORAGE_KEY, '1');
      setVerified(true);
      setError('');
      return;
    }

    setError('PIN 不正确');
    setPin('');
  };

  return (
    <div className="bd-state">
      <div className="bd-state-card" style={{ width: 'min(92vw, 420px)' }}>
        <h3>访问保护</h3>
        <p style={{ color: '#6b524b', marginBottom: 16 }}>请输入 PIN 码继续访问。</p>
        <form onSubmit={submitPin}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              marginBottom: 12,
            }}
          />
          {error ? <p style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p> : null}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#F3B6C2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            解锁
          </button>
        </form>
      </div>
    </div>
  );
};

const useKindleMode = () => {
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isUrlMode = params.get('kindle') === '1';

    const isUAMode = /Kindle/i.test(navigator.userAgent);

    if (isUrlMode || isUAMode) {
      document.body.classList.add('kindle-mode');
    } else {
      document.body.classList.remove('kindle-mode');
    }
  }, [location]);
};

const DebugPanel = () => {
  const location = useLocation();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((v) => v + 1), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const params = new URLSearchParams(location.search);
  const enabled = params.get('debug') === '1';
  if (!enabled) return null;

  const token = localStorage.getItem('access_token') || '';
  const currentBabyId = localStorage.getItem('current_baby_id') || '';
  const currentUserRaw = localStorage.getItem('current_user') || '';
  let userId = '';
  let userName = '';
  try {
    const user = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    userId = user?.id || '';
    userName = user?.nickname || user?.name || '';
  } catch {
    userId = '';
    userName = '';
  }

  const clearAndReload = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_baby_id');
    localStorage.removeItem('current_user');
    localStorage.removeItem('bd_pin_verified');
    sessionStorage.removeItem(KINDLE_BOOTSTRAP_KEY);
    window.location.reload();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.82)',
        color: '#fff',
        fontSize: 12,
        lineHeight: 1.4,
        borderRadius: 8,
        padding: 10,
        wordBreak: 'break-all',
      }}
    >
      <div>debug=1 | {new Date().toLocaleTimeString()} | tick={tick}</div>
      <div>path: {location.pathname}{location.search}</div>
      <div>origin: {window.location.origin}</div>
      <div>api: {API_URL}</div>
      <div>token: {token ? `${token.slice(0, 12)}...` : '(empty)'}</div>
      <div>user: {userId || '(empty)'} {userName ? `(${userName})` : ''}</div>
      <div>baby: {currentBabyId || '(empty)'}</div>
      <div>kindle-mode: {document.body.classList.contains('kindle-mode') ? 'yes' : 'no'}</div>
      <div>ua: {navigator.userAgent}</div>
      <button
        type="button"
        onClick={clearAndReload}
        style={{
          marginTop: 8,
          border: 'none',
          borderRadius: 6,
          padding: '6px 10px',
          background: '#ef4444',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        清会话并重载
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <KindleModeWrapper />
    </Router>
  );
}

const KindleModeWrapper = () => {
  useKindleMode();

  const renderWebPage = (page: React.ReactElement) => (
    <RequireAuth>
      <Layout>{page}</Layout>
    </RequireAuth>
  );

  const renderMobilePage = (page: React.ReactElement) => (
    <RequireAuth>
      <MobileLayout>{page}</MobileLayout>
    </RequireAuth>
  );

  const renderResponsivePage = (desktop: React.ReactElement, mobile: React.ReactElement) => (
    <RequireAuth>
      <ResponsivePage desktop={desktop} mobile={mobile} />
    </RequireAuth>
  );

  const renderHomePage = () => {
    return renderResponsivePage(<Layout><Dashboard /></Layout>, <MobileLayout><MobileHome /></MobileLayout>);
  };

  return (
    <ThemeProvider>
      <PinGate>
        <DebugPanel />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<RequireAuth allowOnboarding><OnboardingMobile /></RequireAuth>} />
          <Route path="/landing" element={<Landing />} />

          <Route path="/states/empty" element={<EmptyStatePage />} />
          <Route path="/states/error" element={<ErrorStatePage />} />
          <Route path="/states/loading" element={<LoadingStatePage />} />
          <Route path="/states/skeleton" element={<SkeletonStatePage />} />
          <Route path="/states/500" element={<ServerErrorPage />} />

          <Route path="/" element={renderHomePage()} />
          <Route path="/dashboard" element={renderHomePage()} />

          <Route path="/records" element={renderResponsivePage(<Layout><RecordsDesktop /></Layout>, <MobileLayout><RecordsMobile /></MobileLayout>)} />
          <Route path="/record" element={renderResponsivePage(<Layout><RecordDesktop /></Layout>, <MobileLayout><RecordMobile /></MobileLayout>)} />
          <Route path="/record/:id" element={renderResponsivePage(<Layout><RecordDetailDesktop /></Layout>, <MobileLayout><RecordDetailMobile /></MobileLayout>)} />
          <Route path="/record/:id/edit" element={renderResponsivePage(<Layout><RecordEditDesktop /></Layout>, <MobileLayout><RecordEditMobile /></MobileLayout>)} />
          <Route path="/statistics" element={renderResponsivePage(<Layout><StatisticsDesktop /></Layout>, <MobileLayout><StatisticsMobile /></MobileLayout>)} />
          <Route path="/ootd" element={renderResponsivePage(<Layout><OotdDesktop /></Layout>, <MobileLayout><OotdMobile /></MobileLayout>)} />
          <Route path="/profile" element={renderResponsivePage(<Layout><ProfileDesktop /></Layout>, <MobileLayout><ProfileMobile /></MobileLayout>)} />
          <Route path="/family" element={renderResponsivePage(<Layout><FamilyDesktop /></Layout>, <MobileLayout><FamilyMobile /></MobileLayout>)} />
          <Route path="/baby" element={renderResponsivePage(<Layout><BabyProfileDesktop /></Layout>, <MobileLayout><BabyProfileMobile /></MobileLayout>)} />
          <Route path="/settings" element={renderResponsivePage(<Layout><SettingsDesktop /></Layout>, <MobileLayout><SettingsMobile /></MobileLayout>)} />
          <Route path="/notifications" element={renderResponsivePage(<Layout><NotificationsDesktop /></Layout>, <MobileLayout><NotificationsMobile /></MobileLayout>)} />
          <Route path="/api-test" element={renderResponsivePage(<Layout><ApiTestDesktop /></Layout>, <MobileLayout><ApiTestMobile /></MobileLayout>)} />
          <Route path="/test" element={renderResponsivePage(<Layout><ApiTestDesktop /></Layout>, <MobileLayout><ApiTestMobile /></MobileLayout>)} />

          <Route path="/web" element={renderWebPage(<Dashboard />)} />
          <Route path="/web/records" element={renderWebPage(<RecordsDesktop />)} />
          <Route path="/web/record" element={renderWebPage(<RecordDesktop />)} />
          <Route path="/web/record/:id" element={renderWebPage(<RecordDetailDesktop />)} />
          <Route path="/web/record/:id/edit" element={renderWebPage(<RecordEditDesktop />)} />
          <Route path="/web/statistics" element={renderWebPage(<StatisticsDesktop />)} />
          <Route path="/web/ootd" element={renderWebPage(<OotdDesktop />)} />
          <Route path="/web/profile" element={renderWebPage(<ProfileDesktop />)} />
          <Route path="/web/family" element={renderWebPage(<FamilyDesktop />)} />
          <Route path="/web/baby" element={renderWebPage(<BabyProfileDesktop />)} />
          <Route path="/web/settings" element={renderWebPage(<SettingsDesktop />)} />
          <Route path="/web/notifications" element={renderWebPage(<NotificationsDesktop />)} />
          <Route path="/web/api-test" element={renderWebPage(<ApiTestDesktop />)} />
          <Route path="/web/test" element={renderWebPage(<ApiTestDesktop />)} />

          <Route path="/mobile" element={renderMobilePage(<MobileHome />)} />
          <Route path="/mobile/records" element={renderMobilePage(<RecordsMobile />)} />
          <Route path="/mobile/record" element={renderMobilePage(<RecordMobile />)} />
          <Route path="/mobile/record/:id" element={renderMobilePage(<RecordDetailMobile />)} />
          <Route path="/mobile/record/:id/edit" element={renderMobilePage(<RecordEditMobile />)} />
          <Route path="/mobile/statistics" element={renderMobilePage(<StatisticsMobile />)} />
          <Route path="/mobile/ootd" element={renderMobilePage(<OotdMobile />)} />
          <Route path="/mobile/profile" element={renderMobilePage(<ProfileMobile />)} />
          <Route path="/mobile/family" element={renderMobilePage(<FamilyMobile />)} />
          <Route path="/mobile/baby" element={renderMobilePage(<BabyProfileMobile />)} />
          <Route path="/mobile/settings" element={renderMobilePage(<SettingsMobile />)} />
          <Route path="/mobile/notifications" element={renderMobilePage(<NotificationsMobile />)} />
          <Route path="/mobile/api-test" element={renderMobilePage(<ApiTestMobile />)} />
          <Route path="/mobile/test" element={renderMobilePage(<ApiTestMobile />)} />
          <Route path="/mobile/onboarding" element={<RequireAuth allowOnboarding><MobileLayout><OnboardingMobile /></MobileLayout></RequireAuth>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PinGate>
    </ThemeProvider>
  );
};

export default App;
