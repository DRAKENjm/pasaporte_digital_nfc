import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Award,
  Gift,
  Tag,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
  Stamp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Por defecto extendido, pero permite colapsar al presionar el logo o botón
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const navGroups: Array<{
    group: string;
    items: Array<{ to: string; end?: boolean; label: string; icon: any }>;
  }> = [
    {
      group: "Principal",
      items: [
        { to: "/admin", end: true, label: "Resumen", icon: LayoutDashboard },
      ],
    },
    {
      group: "Entidades",
      items: [
        { to: "/admin/clientes", label: "Clientes", icon: Users },
        { to: "/admin/locales", label: "Lugares / Locales", icon: Building2 },
        { to: "/admin/usuarios", label: "Usuarios", icon: ShieldCheck },
        { to: "/admin/tarjetas", label: "Tarjetas NFC", icon: CreditCard },
      ],
    },
    {
      group: "Fidelización",
      items: [
        { to: "/admin/sellos", label: "Diseño de Sellos", icon: Stamp },
        { to: "/admin/reglas", label: "Reglas de Sellos", icon: Award },
        { to: "/admin/recompensas", label: "Recompensas", icon: Gift },
        { to: "/admin/categorias", label: "Categorías", icon: Tag },
      ],
    },
    {
      group: "Supervisión",
      items: [
        { to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
        { to: "/admin/reclamaciones", label: "Reclamaciones", icon: ShieldAlert },
        { to: "/admin/legal", label: "Documentos", icon: FileText },
        { to: "/admin/auditoria", label: "Auditoría", icon: ShieldCheck },
        { to: "/admin/configuracion", label: "Configuración", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0ECE6] text-[#2D1A1E] p-2 sm:p-4 lg:p-5 flex gap-4 font-sans selection:bg-[#7C0A1E]/20 selection:text-[#7C0A1E]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Floating Rojo Tinto / Borgoña Sidebar (Refined & Clear) */}
      <aside
        className={`
          fixed lg:sticky top-4 h-[calc(100vh-2rem)] z-50 bg-gradient-to-b from-[#7C0A1E] via-[#6D0819] to-[#580614] border border-[#9B1B30]/30 rounded-3xl text-white flex flex-col shrink-0 shadow-2xl transition-all duration-300 select-none overflow-hidden
          ${mobileOpen ? "translate-x-0 w-64 left-4" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[76px]" : "lg:w-64"}
        `}
      >
        {/* Brand / Logo (Clicking triggers collapse/expand) */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 overflow-hidden text-left group w-full cursor-pointer focus:outline-none"
            title={collapsed ? "Click para expandir menú" : "Click para contraer menú"}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-all duration-200 border border-[#C5A059]/30">
              <img
                src="/logo-icon.png"
                alt="Pasaporte Digital Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-xs tracking-wider text-white uppercase truncate flex items-center gap-1.5">
                  PASAPORTE
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                </h2>
                <span className="text-[10px] font-semibold tracking-wide text-[#E8D3A2] block truncate uppercase">
                  Administrador
                </span>
              </div>
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Links de Navegación por Grupos */}
        <nav className="flex-1 p-2.5 space-y-3.5 overflow-y-auto custom-dark-scrollbar">
          {navGroups.map((g, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <span className="text-[9px] font-black uppercase tracking-widest text-[#E8D3A2]/80 px-3 block">
                  {g.group}
                </span>
              )}
              {g.items.map((item) => (
                <NavLink
                  key={item.label + item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#580614] text-white shadow-inner border border-[#C5A059]/50"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-[#C5A059]" : "text-white/70"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer & Toggle / Logout */}
        <div className="p-2.5 border-t border-white/10 space-y-1 bg-black/15">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors ${
              collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""
            }`}
            title={collapsed ? "Expandir" : "Contraer"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>{collapsed ? "Expandir" : "Contraer menú"}</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium text-white/80 hover:text-rose-200 hover:bg-rose-500/20 transition-colors ${
              collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""
            }`}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0 text-white/70" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Container Area with Rounded Canvas (Fondo Claro y Textos Nítidos) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5] border border-[#E8DFD5] rounded-3xl shadow-xl overflow-hidden min-h-[calc(100vh-2rem)]">
        {/* Top Navbar */}
        <header className="px-5 sm:px-8 py-4 bg-white/90 backdrop-blur-md border-b border-[#E8DFD5] flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] text-[#2D1A1E] hover:bg-[#F0ECE6]"
            >
              <Menu size={18} />
            </button>

            {/* Title / Brand Display */}
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#2D1A1E] tracking-tight flex items-center gap-2">
                Panel General
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7C0A1E]/10 text-[#7C0A1E] border border-[#7C0A1E]/20">
                  En Vivo
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Search and Top Icons */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#F5EFEB] border border-[#E8DFD5] px-3.5 py-2 rounded-2xl w-64 focus-within:border-[#7C0A1E]/40 focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-[#8E7D7D]" />
              <input
                type="text"
                placeholder="Buscar módulo, cliente, NFC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-[#2D1A1E] focus:outline-none w-full placeholder:text-[#8E7D7D]"
              />
            </div>

            {/* Notification & Profile Icons */}
            <button
              onClick={() => navigate("/admin/reclamaciones")}
              className="w-9 h-9 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#7C0A1E]/40 flex items-center justify-center text-[#5A4B4B] hover:text-[#7C0A1E] transition-all relative shadow-2xs"
              title="Notificaciones y reclamaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#7C0A1E]" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E8DFD5]">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7C0A1E] to-[#9B1B30] text-white font-black text-xs flex items-center justify-center shadow-xs">
                AG
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-[#2D1A1E] leading-tight">Admin General</p>
                <p className="text-[10px] text-[#8E7D7D] truncate max-w-[130px] font-medium">{user?.email || "admin@pasaporte.pe"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

