import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, MapPin, Users, Gift, Store, Shield, Bell } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../hooks/useUI";
import { ProfileSheet } from "../components/profile/ProfileSheet";
import { greeting, initials } from "../utils/levels";

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const { profileOpen, openProfile, closeProfile } = useUI();
  const location = useLocation();
  const role = (user?.role || user?.rol || "").toUpperCase();
  const isCommerce = role === "COMERCIO" || role === "COMMERCE";
  const isAdmin = role === "ADMIN" || role === "ADMINISTRADOR";
  const isHome =
    location.pathname === "/user/home" || location.pathname === "/user/wallet";

  const nombreCorto =
    user?.nombres?.split(" ")[0] || user?.username || "viajero";

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-[rgb(var(--app-bg))] text-[rgb(var(--app-text))] border-x border-[rgb(var(--app-border))] shadow-card">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-area-pt bg-[rgb(var(--app-bg))]/90 backdrop-blur-md border-b border-[rgb(var(--app-border))]">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-sm font-bold">P</span>
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm tracking-tight leading-none">
                Pasaporte NFC
              </p>
              {isHome && (
                <p className="text-xs text-muted mt-0.5 truncate">
                  {greeting()}, {nombreCorto}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className="min-h-touch min-w-touch flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={openProfile}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-sky-400/30"
              aria-label="Abrir perfil"
            >
              {user?.avatarUrl || user?.avatar_url ? (
                <img
                  src={user.avatarUrl || user.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials(user)
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28 overflow-y-auto scroll-touch">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[rgb(var(--app-card))]/95 backdrop-blur-lg border-t border-[rgb(var(--app-border))] safe-area-pb">
        <div className="flex items-center justify-around px-1 py-1.5">
          <NavItem to="/user/home" label="Inicio" icon={Home} />
          <NavItem to="/user/locales" label="Locales" icon={MapPin} />
          <NavItem to="/user/feed" label="Comunidad" icon={Users} />
          <NavItem to="/user/rewards" label="Recompensas" icon={Gift} />
          {isCommerce && (
            <NavItem
              to="/commerce"
              label="Local"
              icon={Store}
              activeClass="text-amber-500"
            />
          )}
          {isAdmin && (
            <NavItem
              to="/admin"
              label="Admin"
              icon={Shield}
              activeClass="text-violet-500"
            />
          )}
        </div>
      </nav>

      <ProfileSheet open={profileOpen} onClose={closeProfile} />
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass?: string;
}> = ({ to, label, icon: Icon, activeClass = "text-sky-500" }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[52px] px-1 rounded-xl transition-colors ${
        isActive
          ? activeClass
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon className={`w-5 h-5 ${isActive ? "" : ""}`} />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </>
    )}
  </NavLink>
);
