import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  Users,
  History,
  Gift,
  TicketCheck,
  BarChart3,
  Store,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  Wifi,
  Stamp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const CommerceLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const navItems = [
    { to: "/commerce", end: true, label: "Inicio", icon: LayoutDashboard },
    { to: "/commerce/validar", label: "Validar visita", icon: ScanLine, highlight: true },
    { to: "/commerce/sello", label: "Mi Sello Digital", icon: Stamp },
    { to: "/commerce/clientes", label: "Clientes", icon: Users },
    { to: "/commerce/historial", label: "Historial", icon: History },
    { to: "/commerce/recompensas", label: "Recompensas", icon: Gift },
    { to: "/commerce/canjes", label: "Canjes", icon: TicketCheck },
    { to: "/commerce/estadisticas", label: "Estadísticas", icon: BarChart3 },
    { to: "/commerce/perfil", label: "Perfil del local", icon: Store },
    { to: "/commerce/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D1A1E] flex flex-row">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen z-50 bg-[#7C0A1E] text-white flex flex-col shrink-0 shadow-2xl transition-all duration-300 select-none
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        {/* Brand / Local Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-md border border-[#C5A059]/30">
              <img
                src="/logo-icon.png"
                alt="Pasaporte Digital"
                className="w-full h-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="font-serif font-black text-xs tracking-wider text-[#FAF8F5] uppercase truncate">
                  PANEL COMERCIO
                </h2>
                <span className="text-[9px] font-bold tracking-widest text-[#C5A059] uppercase block truncate">
                  TERMINAL DE LOCAL
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 items-center justify-center text-white/80 transition-colors"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.label + item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#600616] text-[#FAF8F5] shadow-sm border-l-4 border-[#C5A059]"
                    : item.highlight
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${item.highlight ? "text-[#C5A059]" : "text-white/90"}`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:bg-white/10 hover:text-rose-300 transition-colors ${
              collapsed ? "justify-center px-0" : ""
            }`}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#EFE7DE] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#2D1A1E] hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-[#2D1A1E]">Terminal NFC Conectada</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#2D1A1E]">{user?.nombres || "Encargado de Local"}</p>
              <p className="text-[10px] text-[#8E7D7D] font-medium">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-rose-50 border border-[#7C0A1E]/30 text-[#7C0A1E] font-black text-xs flex items-center justify-center">
              {user?.nombres?.charAt(0) || "L"}
            </div>
          </div>
        </header>

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
