import { Toaster } from '@/components/ui/sonner';
import { Navigate, Outlet, Route, Routes, type To } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { useAuth } from './lib/AuthContext';
import CertificatesResolversPage from './pages/CertificatesResolversPage';
import DashboardPage from './pages/DashboardPage';
import ErrorPage from './pages/ErrorPage';
import LoginPage from './pages/LoginPage';
import MiddlewaresPage from './pages/MiddlewaresPage';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage';
import RoutersPage from './pages/RoutersPage';
import ServicesPage from './pages/ServicesPage';
import SettingsPage from './pages/SettingsPage';
import StatusPage from './pages/StatusPage';
import UserManagementPage from './pages/UserManagementPage';

const ProtectedRoute = ({
  children,
  isAllowed = true,
  redirectPath,
}: {
  isAllowed?: boolean;
  redirectPath: To;
  children: React.ReactNode;
}) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path='/auth'
          element={
            <ProtectedRoute isAllowed={!isAuthenticated} redirectPath='/dashboard'>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path='login' element={<LoginPage />} />
          <Route path='forgot-password' element={<PasswordRecoveryPage />} />
          <Route path='reset-password' element={<PasswordRecoveryPage />} />
          <Route path='*' element={<Navigate to='/error/404' replace />} />
        </Route>
        <Route
          element={
            <ProtectedRoute isAllowed={!!isAuthenticated} redirectPath='/auth/login'>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path='/' element={<Navigate to='/dashboard' replace />} />
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/routers' element={<RoutersPage />} />
          <Route path='/services' element={<ServicesPage />} />
          <Route path='/middlewares' element={<MiddlewaresPage />} />
          <Route path='/status' element={<StatusPage />} />
          <Route path='/certificates-resolvers' element={<CertificatesResolversPage />} />
          <Route path='/users' element={<UserManagementPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='*' element={<Navigate to='/error/404' replace />} />
        </Route>
        <Route path='/error/:status' element={<ErrorPage />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
