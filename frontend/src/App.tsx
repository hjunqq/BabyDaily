import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Ootd } from './pages/Ootd';
import { Landing } from './pages/Landing';
import { MobileHome } from './pages/MobileHome';
import { ApiTest } from './pages/ApiTest';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mobile" element={<MobileHome />} />
          <Route path="/test" element={<ApiTest />} />
          <Route path="/web" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/ootd" element={
            <Layout>
              <Ootd />
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
