import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { MobileLayout } from './layouts/MobileLayout';
import { useIsMobile } from './hooks/useIsMobile';
import { BabyService } from './services/api';

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

const ResponsivePage = ({ desktop, mobile }: { desktop: React.ReactElement; mobile: React.ReactElement }) => {
  const isMobile = useIsMobile();
  if (isMobile === null) return null;
  return isMobile ? mobile : desktop;
};

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  const isAuthed = BabyService.isAuthenticated();

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const useKindleMode = () => {
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isUrlMode = params.get('kindle') === '1';

    // Auto-detect Kindle device via User Agent (case-insensitive)
    // Checks for "Kindle" in UA string (common in E-ink browsers)
    const isUAMode = /Kindle/i.test(navigator.userAgent);

    if (isUrlMode || isUAMode) {
      document.body.classList.add('kindle-mode');
    } else {
      document.body.classList.remove('kindle-mode');
    }
  }, [location]);
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

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />

        <Route path="/states/empty" element={<EmptyStatePage />} />
        <Route path="/states/error" element={<ErrorStatePage />} />
        <Route path="/states/loading" element={<LoadingStatePage />} />
        <Route path="/states/skeleton" element={<SkeletonStatePage />} />
        <Route path="/states/500" element={<ServerErrorPage />} />

        <Route path="/" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><Dashboard /></Layout>}
              mobile={<MobileLayout><MobileHome /></MobileLayout>}
            />
          </RequireAuth>
        } />

        {/* Unified Responsive Routes */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route path="/records" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><RecordsDesktop /></Layout>}
              mobile={<MobileLayout><RecordsMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/record" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><RecordDesktop /></Layout>}
              mobile={<MobileLayout><RecordMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/record/:id" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><RecordDetailDesktop /></Layout>}
              mobile={<MobileLayout><RecordDetailMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/record/:id/edit" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><RecordEditDesktop /></Layout>}
              mobile={<MobileLayout><RecordEditMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/statistics" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><StatisticsDesktop /></Layout>}
              mobile={<MobileLayout><StatisticsMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/ootd" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><OotdDesktop /></Layout>}
              mobile={<MobileLayout><OotdMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><ProfileDesktop /></Layout>}
              mobile={<MobileLayout><ProfileMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/family" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><FamilyDesktop /></Layout>}
              mobile={<MobileLayout><FamilyMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/baby" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><BabyProfileDesktop /></Layout>}
              mobile={<MobileLayout><BabyProfileMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/settings" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><SettingsDesktop /></Layout>}
              mobile={<MobileLayout><SettingsMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/notifications" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><NotificationsDesktop /></Layout>}
              mobile={<MobileLayout><NotificationsMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        <Route path="/api-test" element={
          <RequireAuth>
            <ResponsivePage
              desktop={<Layout><ApiTestDesktop /></Layout>}
              mobile={<MobileLayout><ApiTestMobile /></MobileLayout>}
            />
          </RequireAuth>
        } />

        {/* Legacy Redirects */}
        <Route path="/web" element={<Navigate to="/" replace />} />
        <Route path="/web/records" element={<Navigate to="/records" replace />} />
        <Route path="/web/record" element={<Navigate to="/record" replace />} />
        <Route path="/web/record/:id" element={<Navigate to="/record/:id" replace />} />
        <Route path="/web/record/:id/edit" element={<Navigate to="/record/:id/edit" replace />} />
        <Route path="/web/statistics" element={<Navigate to="/statistics" replace />} />
        <Route path="/web/ootd" element={<Navigate to="/ootd" replace />} />
        <Route path="/web/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/web/family" element={<Navigate to="/family" replace />} />
        <Route path="/web/baby" element={<Navigate to="/baby" replace />} />
        <Route path="/web/settings" element={<Navigate to="/settings" replace />} />
        <Route path="/web/notifications" element={<Navigate to="/notifications" replace />} />
        <Route path="/web/api-test" element={<Navigate to="/api-test" replace />} />

        <Route path="/mobile" element={<Navigate to="/" replace />} />
        <Route path="/mobile/records" element={<Navigate to="/records" replace />} />
        <Route path="/mobile/record" element={<Navigate to="/record" replace />} />
        <Route path="/mobile/record/:id" element={<Navigate to="/record/:id" replace />} />
        <Route path="/mobile/record/:id/edit" element={<Navigate to="/record/:id/edit" replace />} />
        <Route path="/mobile/statistics" element={<Navigate to="/statistics" replace />} />
        <Route path="/mobile/ootd" element={<Navigate to="/ootd" replace />} />
        <Route path="/mobile/profile" element={<Navigate to="/profile" replace />} />
        <Route path="/mobile/family" element={<Navigate to="/family" replace />} />
        <Route path="/mobile/baby" element={<Navigate to="/baby" replace />} />
        <Route path="/mobile/settings" element={<Navigate to="/settings" replace />} />
        <Route path="/mobile/notifications" element={<Navigate to="/notifications" replace />} />
        <Route path="/mobile/api-test" element={<Navigate to="/api-test" replace />} />
        <Route path="/mobile/onboarding" element={<RequireAuth><MobileLayout><OnboardingMobile /></MobileLayout></RequireAuth>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
