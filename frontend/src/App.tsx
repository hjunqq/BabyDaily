import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Ootd } from './pages/Ootd';
import { Landing } from './pages/Landing';
import { MobileHome } from './pages/MobileHome';
import { ApiTest } from './pages/ApiTest';
import { MobileLayout } from './layouts/MobileLayout';
import { useIsMobile } from './hooks/useIsMobile';
import { Login } from './pages/Login';
import { BabyService } from './services/api';

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
          <Route path="/" element={
            <RequireAuth>
              <ResponsivePage
                desktop={<Layout><Dashboard /></Layout>}
                mobile={<MobileLayout><MobileHome /></MobileLayout>}
              />
            </RequireAuth>
          } />
          <Route path="/landing" element={<Landing />} />
          <Route path="/mobile" element={
            <RequireAuth>
              <MobileLayout><MobileHome /></MobileLayout>
            </RequireAuth>
          } />
          <Route path="/test" element={
            <RequireAuth>
              <ResponsivePage
                desktop={<Layout><ApiTest /></Layout>}
                mobile={<MobileLayout><ApiTest /></MobileLayout>}
              />
            </RequireAuth>
          } />
          <Route path="/web" element={
            <RequireAuth>
              <ResponsivePage
                desktop={<Layout><Dashboard /></Layout>}
                mobile={<MobileLayout><MobileHome /></MobileLayout>}
              />
            </RequireAuth>
          } />
          <Route path="/ootd" element={
            <RequireAuth>
              <ResponsivePage
                desktop={<Layout><Ootd /></Layout>}
                mobile={<MobileLayout><Ootd /></MobileLayout>}
              />
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
