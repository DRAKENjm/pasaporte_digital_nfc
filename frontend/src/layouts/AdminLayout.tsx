import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Award,
  Users,
  CreditCard,
  Gift,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../utils/levels";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const nav = (
    <>
      <NavItem to="/admin" end label="Resumen" icon={LayoutDashboard} />
      <NavItem to="/admin/locales" label="Locales Aliados" icon={Building2} />
      <NavItem to="/admin/reglas" label="Reglas de Sellos" icon={Award} />
      <NavItem to="/admin/usuarios" label="Usuarios & Roles" icon={Users} />
      <NavItem to="/admin/tarjetas" label="Tarjetas NFC" icon={CreditCard} />
      <NavItem to="/admin/recompensas" label="Recompensas" icon={Gift} />
      <NavItem to="/admin/reclamaciones" label="Reclamaciones" icon={FileText} />
    </>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-text))]">
      <div className="lg:flex lg:max-w-7xl lg:mx-auto">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:w-64 flex-col border-r border-[rgb(var(--app-border))] sticky top-0 h-screen p-5 bg-[rgb(var(--app-surface))]">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                Administración
              </p>
              <p className="text-[11px] font-semibold text-sky-700 tracking-wide uppercase">
                Pasaporte NFC
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 flex-1">{nav}</nav>

          <div className="pt-4 border-t border-[rgb(var(--app-border))] space-y-2">
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initials(user)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">
                  {user?.nombres || user?.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-muted truncate">{user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-500/10 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <div className="min-w-0 flex-1 flex flex-col min-h-screen">
          {/* Header Mobile / Tablet */}
          <header className="sticky top-0 z-40 bg-[rgb(var(--app-surface))]/95 backdrop-blur-sm border-b border-[rgb(var(--app-border))] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-slate-900 dark:text-white lg:hidden" />
              <div>
                <p className="font-bold text-sm">Panel de Control</p>
                <p className="text-[10px] text-muted lg:hidden truncate max-w-[40vw]">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                ADMIN
              </span>
              <button
                type="button"
                onClick={logout}
                className="lg:hidden p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 min-w-0">
            <div className="max-w-5xl mx-auto">
              <Outlet />
            </div>
          </main>

          {/* Bottom Nav Mobile */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[rgb(var(--app-surface))] border-t border-[rgb(var(--app-border))] safe-area-pb overflow-x-auto z-40">
            <div className="flex justify-around min-w-max px-2 py-1">{nav}</div>
          </nav>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}> = ({ to, label, icon: Icon, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex flex-col lg:flex-row items-center lg:gap-3 min-w-[70px] min-h-[48px] px-2.5 py-2 rounded-xl text-[10px] lg:text-xs font-semibold transition ${
        isActive
          ? "bg-slate-900 text-white shadow-xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
      }`
    }
  >
    <Icon className="w-4 h-4 lg:w-4 lg:h-4 shrink-0" />
    <span className="leading-tight text-center lg:text-left">{label}</span>
  </NavLink>
);
