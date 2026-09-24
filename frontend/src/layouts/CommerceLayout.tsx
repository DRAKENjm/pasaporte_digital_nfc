import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  History,
  LogOut,
  Store,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../utils/levels";

/** Layout exclusivo COMERCIO — validación NFC y métricas del local */
export const CommerceLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const nav = (
    <>
      <NavItem to="/commerce" end label="Panel" icon={LayoutDashboard} />
      <NavItem to="/commerce/validar" label="Validar" icon={ScanLine} />
      <NavItem to="/commerce/historial" label="Historial" icon={History} />
    </>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-text))]">
      <div className="lg:flex lg:max-w-6xl lg:mx-auto">
        <aside className="hidden lg:flex lg:w-56 flex-col border-r border-[rgb(var(--app-border))] sticky top-0 h-screen p-4">
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm">Panel Local</p>
              <p className="text-[10px] text-muted">COMERCIO</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 flex-1">{nav}</nav>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </aside>

        <div className="min-w-0 flex-1 flex flex-col min-h-screen max-w-md lg:max-w-none mx-auto w-full">
          <header className="sticky top-0 z-40 bg-[rgb(var(--app-bg))]/90 backdrop-blur border-b border-[rgb(var(--app-border))] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center lg:hidden">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Panel del local</p>
                <p className="text-[11px] text-muted truncate max-w-[180px]">
                  {user?.nombres || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full">
                Comercio
              </span>
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                {initials(user)}
              </span>
              <button
                type="button"
                onClick={logout}
                className="lg:hidden text-rose-500 p-2"
                aria-label="Salir"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 lg:px-8 py-4 pb-24 lg:pb-8 min-w-0">
            <div className="max-w-2xl">
              <Outlet />
            </div>
          </main>

          <nav className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[rgb(var(--app-card))] border-t border-[rgb(var(--app-border))] safe-area-pb">
            <div className="flex justify-around py-1">{nav}</div>
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
      `flex flex-col lg:flex-row items-center lg:gap-3 min-w-[64px] min-h-[52px] lg:px-3 lg:py-2.5 lg:rounded-xl text-[10px] lg:text-sm font-medium ${
        isActive ? "text-amber-600 lg:bg-amber-500/10" : "text-slate-400"
      }`
    }
  >
    <Icon className="w-5 h-5" />
    {label}
  </NavLink>
);
