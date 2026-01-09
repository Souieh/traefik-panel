import { Toaster } from "@/components/ui/sonner";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import CertificatesResolversPage from "./pages/CertificatesResolversPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MiddlewaresPage from "./pages/MiddlewaresPage";
import PasswordRecoveryPage from "./pages/PasswordRecoveryPage";
import RoutersPage from "./pages/RoutersPage";
import ServicesPage from "./pages/ServicesPage";
import SettingsPage from "./pages/SettingsPage";
import StatusPage from "./pages/StatusPage";
import UserManagementPage from "./pages/UserManagementPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
        <Route path="/reset-password" element={<PasswordRecoveryPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/routers" element={<RoutersPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/middlewares" element={<MiddlewaresPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route
            path="/certificates-resolvers"
            element={<CertificatesResolversPage />}
          />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
