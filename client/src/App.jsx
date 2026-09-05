import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import StudentHomePage from './pages/StudentHomePage.jsx';
import ReportIncidentPage from './pages/ReportIncidentPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import RoutePlannerPage from './pages/RoutePlannerPage.jsx';
import SecurityDashboardPage from './pages/SecurityDashboardPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';

function ProtectedPage({ roles, children }) {
  return <ProtectedRoute roles={roles}><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student" element={<ProtectedPage roles={['Student']}><StudentHomePage /></ProtectedPage>} />
      <Route path="/student/report" element={<ProtectedPage roles={['Student']}><ReportIncidentPage /></ProtectedPage>} />
      <Route path="/student/reports" element={<ProtectedPage roles={['Student']}><MyReportsPage /></ProtectedPage>} />
      <Route path="/student/route" element={<ProtectedPage roles={['Student']}><RoutePlannerPage /></ProtectedPage>} />
      <Route path="/security" element={<ProtectedPage roles={['CPS']}><SecurityDashboardPage /></ProtectedPage>} />
      <Route path="/security/analytics" element={<ProtectedPage roles={['CPS']}><AnalyticsPage /></ProtectedPage>} />
      <Route path="*" element={<Navigate to={user ? (user.role === 'CPS' ? '/security' : '/student') : '/login'} replace />} />
    </Routes>
  );
}
