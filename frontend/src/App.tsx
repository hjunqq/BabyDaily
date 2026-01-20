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

function App() {
  const ResponsivePage = ({ desktop, mobile }: { desktop: JSX.Element; mobile: JSX.Element }) => {
    const isMobile = useIsMobile();
    if (isMobile === null) return null;
    return isMobile ? mobile : desktop;
  };

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const location = useLocation();
    const isAuthed = BabyService.isAuthenticated();

    if (!isAuthed) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  };

  return (
    <Router>
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

          <Route path="/web" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/web/records" element={<RequireAuth><Layout><RecordsDesktop /></Layout></RequireAuth>} />
          <Route path="/web/record" element={<RequireAuth><Layout><RecordDesktop /></Layout></RequireAuth>} />
          <Route path="/web/record/:id" element={<RequireAuth><Layout><RecordDetailDesktop /></Layout></RequireAuth>} />
          <Route path="/web/record/:id/edit" element={<RequireAuth><Layout><RecordEditDesktop /></Layout></RequireAuth>} />
          <Route path="/web/statistics" element={<RequireAuth><Layout><StatisticsDesktop /></Layout></RequireAuth>} />
          <Route path="/web/ootd" element={<RequireAuth><Layout><OotdDesktop /></Layout></RequireAuth>} />
          <Route path="/web/profile" element={<RequireAuth><Layout><ProfileDesktop /></Layout></RequireAuth>} />
          <Route path="/web/family" element={<RequireAuth><Layout><FamilyDesktop /></Layout></RequireAuth>} />
          <Route path="/web/baby" element={<RequireAuth><Layout><BabyProfileDesktop /></Layout></RequireAuth>} />
          <Route path="/web/settings" element={<RequireAuth><Layout><SettingsDesktop /></Layout></RequireAuth>} />
          <Route path="/web/notifications" element={<RequireAuth><Layout><NotificationsDesktop /></Layout></RequireAuth>} />
          <Route path="/web/api-test" element={<RequireAuth><Layout><ApiTestDesktop /></Layout></RequireAuth>} />

          <Route path="/mobile" element={<RequireAuth><MobileLayout><MobileHome /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/records" element={<RequireAuth><MobileLayout><RecordsMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/record" element={<RequireAuth><MobileLayout><RecordMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/record/:id" element={<RequireAuth><MobileLayout><RecordDetailMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/record/:id/edit" element={<RequireAuth><MobileLayout><RecordEditMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/statistics" element={<RequireAuth><MobileLayout><StatisticsMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/ootd" element={<RequireAuth><MobileLayout><OotdMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/profile" element={<RequireAuth><MobileLayout><ProfileMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/family" element={<RequireAuth><MobileLayout><FamilyMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/baby" element={<RequireAuth><MobileLayout><BabyProfileMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/settings" element={<RequireAuth><MobileLayout><SettingsMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/notifications" element={<RequireAuth><MobileLayout><NotificationsMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/api-test" element={<RequireAuth><MobileLayout><ApiTestMobile /></MobileLayout></RequireAuth>} />
          <Route path="/mobile/onboarding" element={<MobileLayout><OnboardingMobile /></MobileLayout>} />

          <Route path="/ootd" element={
            <RequireAuth>
              <ResponsivePage
                desktop={<Layout><OotdDesktop /></Layout>}
                mobile={<MobileLayout><OotdMobile /></MobileLayout>}
              />
            </RequireAuth>
          } />

          <Route path="/test" element={
            <RequireAuth>
              <ResponsivePage
                desktop={<Layout><ApiTestDesktop /></Layout>}
                mobile={<MobileLayout><ApiTestMobile /></MobileLayout>}
              />
            </RequireAuth>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
