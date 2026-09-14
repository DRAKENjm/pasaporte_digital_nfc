import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RecoverPassword } from './pages/auth/RecoverPassword';
import { FeedPage } from './pages/user/FeedPage';
import { WalletPage } from './pages/user/WalletPage';
import { RewardsPage } from './pages/user/RewardsPage';
import { CommerceDashboard } from './pages/commerce/CommerceDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/user/wallet" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas de Autenticación */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="recover" element={<RecoverPassword />} />
              <Route index element={<Navigate to="/auth/login" replace />} />
            </Route>

            {/* Rutas Principales Protegidas */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/user/feed" element={<FeedPage />} />
              <Route path="/user/wallet" element={<WalletPage />} />
              <Route path="/user/rewards" element={<RewardsPage />} />

              {/* Panel de Comercio */}
              <Route
                path="/commerce"
                element={
                  <ProtectedRoute allowedRoles={['COMMERCE', 'ADMIN']}>
                    <CommerceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Panel de SuperAdmin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </AuthProvider>
  );
};

export default App;
