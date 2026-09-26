import React from "react";
import { AdminLocales } from "./pages/admin/AdminLocales";
import { VerifyEmail } from "./pages/auth/VerifyEmail";
import { PublicPost } from "./pages/user/PublicPost";
import { LibroReclamacionesPage } from "./pages/public/LibroReclamacionesPage";
import { FriendsPage } from "./pages/user/FriendsPage";
import { AdminReclamaciones } from "./pages/admin/AdminReclamaciones";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthLayout } from "./layouts/AuthLayout";
import { ClientLayout } from "./layouts/ClientLayout";
import { CommerceLayout } from "./layouts/CommerceLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { RecoverPassword } from "./pages/auth/RecoverPassword";
import { HomePage } from "./pages/user/HomePage";
import { ExplorarPage } from "./pages/user/ExplorarPage";
import { PasaporteNfcPage } from "./pages/user/PasaporteNfcPage";
import { ActividadPage } from "./pages/user/ActividadPage";
import { PerfilPage } from "./pages/user/PerfilPage";
import { RewardsPage } from "./pages/user/RewardsPage";
import { LocalesPage } from "./pages/user/LocalesPage";
import { LocalDetailPage } from "./pages/user/LocalDetailPage";
import { CommerceHome } from "./pages/commerce/CommerceHome";
import { CommerceValidar } from "./pages/commerce/CommerceValidar";
import { CommerceClientes } from "./pages/commerce/CommerceClientes";
import { CommerceHistorial } from "./pages/commerce/CommerceHistorial";
import { CommerceRecompensas } from "./pages/commerce/CommerceRecompensas";
import { CommerceCanjes } from "./pages/commerce/CommerceCanjes";
import { CommerceEstadisticas } from "./pages/commerce/CommerceEstadisticas";
import { CommercePerfil } from "./pages/commerce/CommercePerfil";
import { CommerceConfiguracion } from "./pages/commerce/CommerceConfiguracion";
import { CommerceSello } from "./pages/commerce/CommerceSello";
import { AdminHome } from "./pages/admin/AdminHome";
import { AdminSellos } from "./pages/admin/AdminSellos";
import { AdminReglas } from "./pages/admin/AdminReglas";
import { AdminUsuarios } from "./pages/admin/AdminUsuarios";
import { AdminTarjetas } from "./pages/admin/AdminTarjetas";
import { AdminRecompensas } from "./pages/admin/AdminRecompensas";
import { AdminCategorias } from "./pages/admin/AdminCategorias";
import { AdminReportes } from "./pages/admin/AdminReportes";
import { AdminConfiguracion } from "./pages/admin/AdminConfiguracion";
import { AdminAuditoria } from "./pages/admin/AdminAuditoria";
import { AdminLegal } from "./pages/admin/AdminLegal";
import { useAuth } from "./hooks/useAuth";
import { Spinner } from "./components/common/Spinner";
import { homePathForRole, normalizeRole, AppRole } from "./utils/roles";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--app-bg))]">
        <Spinner size={36} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const r = normalizeRole(role);
  if (allowedRoles && !allowedRoles.includes(r)) {
    return <Navigate to={homePathForRole(r)} replace />;
  }

  return <>{children}</>;
};

const RoleHomeRedirect: React.FC = () => {
  const { role, loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={36} />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <Navigate to={homePathForRole(role)} replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/post/:id" element={<PublicPost />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reclamaciones" element={<LibroReclamacionesPage />} />
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="recover" element={<RecoverPassword />} />
                <Route
                  index
                  element={<Navigate to="/auth/login" replace />}
                />
              </Route>

              {/* CLIENTE: 4 Secciones Principales + Pasaporte NFC */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["CLIENTE"]}>
                    <ClientLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/user/home" element={<HomePage />} />
                <Route path="/user/explorar" element={<ExplorarPage />} />
                <Route path="/user/pasaporte" element={<PasaporteNfcPage />} />
                <Route path="/user/actividad" element={<ActividadPage />} />
                <Route path="/user/perfil" element={<PerfilPage />} />
                <Route path="/user/rewards" element={<RewardsPage />} />
                <Route path="/user/locales" element={<LocalesPage />} />
                <Route path="/user/locales/:id" element={<LocalDetailPage />} />
                <Route path="/user/reclamaciones" element={<LibroReclamacionesPage />} />
              </Route>

              {/* COMERCIO / LOCAL AFILIADO */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["COMERCIO", "ADMIN"]}>
                    <CommerceLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/commerce" element={<CommerceHome />} />
                <Route path="/commerce/validar" element={<CommerceValidar />} />
                <Route path="/commerce/sello" element={<CommerceSello />} />
                <Route path="/commerce/clientes" element={<CommerceClientes />} />
                <Route path="/commerce/historial" element={<CommerceHistorial />} />
                <Route path="/commerce/recompensas" element={<CommerceRecompensas />} />
                <Route path="/commerce/canjes" element={<CommerceCanjes />} />
                <Route path="/commerce/estadisticas" element={<CommerceEstadisticas />} />
                <Route path="/commerce/perfil" element={<CommercePerfil />} />
                <Route path="/commerce/configuracion" element={<CommerceConfiguracion />} />
              </Route>

              {/* ADMIN */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminHome />} />
                <Route path="/admin/locales" element={<AdminLocales />} />
                <Route path="/admin/sellos" element={<AdminSellos />} />
                <Route path="/admin/categorias" element={<AdminCategorias />} />
                <Route path="/admin/reglas" element={<AdminReglas />} />
                <Route path="/admin/clientes" element={<AdminUsuarios modo="CLIENTES" />} />
                <Route path="/admin/usuarios" element={<AdminUsuarios modo="USUARIOS" />} />
                <Route path="/admin/tarjetas" element={<AdminTarjetas />} />
                <Route
                  path="/admin/recompensas"
                  element={<AdminRecompensas />}
                />
                <Route
                  path="/admin/reclamaciones"
                  element={<AdminReclamaciones />}
                />
                <Route path="/admin/reportes" element={<AdminReportes />} />
                <Route path="/admin/legal" element={<AdminLegal />} />
                <Route path="/admin/auditoria" element={<AdminAuditoria />} />
                <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
              </Route>

              <Route path="/" element={<RoleHomeRedirect />} />
              <Route path="*" element={<RoleHomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
