import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto border-x border-slate-900 shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎟️</span>
          <span className="font-extrabold text-sm tracking-tight text-white">Pasaporte NFC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-medium">
            {user?.role}
          </span>
          <button onClick={logout} className="text-xs text-rose-400 hover:text-rose-300 font-medium">
            Salir
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-6 py-3 flex items-center justify-around z-40">
        <NavLink
          to="/user/feed"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-medium ${isActive ? 'text-sky-400' : 'text-slate-500'}`}
        >
          <span>🌐</span>
          <span>Social</span>
        </NavLink>
        <NavLink
          to="/user/wallet"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-medium ${isActive ? 'text-sky-400' : 'text-slate-500'}`}
        >
          <span>💼</span>
          <span>Puntos</span>
        </NavLink>
        <NavLink
          to="/user/rewards"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-medium ${isActive ? 'text-sky-400' : 'text-slate-500'}`}
        >
          <span>🎁</span>
          <span>Premios</span>
        </NavLink>
        {(user?.role === 'COMERCIO' || user?.role === 'COMMERCE') && (
          <NavLink
            to="/commerce"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-medium ${isActive ? 'text-amber-400' : 'text-slate-500'}`}
          >
            <span>🏪</span>
            <span>Local</span>
          </NavLink>
        )}
        {(user?.role === 'ADMIN' || user?.role === 'ADMINISTRADOR') && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-medium ${isActive ? 'text-purple-400' : 'text-slate-500'}`}
          >
            <span>⚡</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
};
