import React, { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Tag,
  Award,
  Users,
  CreditCard,
  Gift,
  FileText,
  Shield,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Check,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../utils/levels";
import api from "../services/api";

interface NotificacionResumen {
  total_pendientes: number;
  canjes_pendientes_count: number;
  canjes_pendientes: Array<{
    id: string;
    fecha_canje: string;
    puntos_gastados: number;
    usuario_nombre: string;
    avatar_url?: string;
    nombre_recompensa: string;
  }>;
  reclamaciones_pendientes_count: number;
  reclamaciones_pendientes: Array<{
    id: string;
    codigo_seguimiento: string;
    tipo_registro: string;
    nombres_reclamante: string;
    created_at: string;
  }>;
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionResumen | null>(null);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/usuarios?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const loadNotificaciones = async () => {
    try {
      setLoadingNotifs(true);
      const { data } = await api.get("/admin/notificaciones");
      const info = data?.data ?? data;
      setNotificaciones(info);
    } catch {
      // Ignorar errores silenciosamente para no bloquear layout
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadNotificaciones();
    // Polling ligero cada 45 segundos para notificaciones de canjes y reclamos
    const timer = setInterval(loadNotificaciones, 45000);
    return () => clearInterval(timer);
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen]);

  const nav = (
    <>
      <NavItem to="/admin" end label="Dashboard" icon={LayoutDashboard} />
      <NavItem to="/admin/locales" label="Locales" icon={Building2} />
      <NavItem to="/admin/categorias" label="Categorías" icon={Tag} />
      <NavItem to="/admin/reglas" label="Sellos" icon={Award} />
      <NavItem to="/admin/usuarios" label="Usuarios & Roles" icon={Users} />
      <NavItem to="/admin/tarjetas" label="Tarjetas NFC" icon={CreditCard} />
      <NavItem
        to="/admin/recompensas"
        label="Recompensas"
        icon={Gift}
        badge={
          (notificaciones?.canjes_pendientes_count ?? 0) > 0
            ? String(notificaciones?.canjes_pendientes_count)
            : undefined
        }
      />
      <NavItem
        to="/admin/reclamaciones"
        label="Reclamaciones"
        icon={FileText}
        badge={
          (notificaciones?.reclamaciones_pendientes_count ?? 0) > 0
            ? String(notificaciones?.reclamaciones_pendientes_count)
            : undefined
        }
      />
    </>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 flex-col fixed inset-y-0 left-0 bg-[#0B1522] text-white z-50 border-r border-slate-800/80 select-none">
        {/* Header Marca */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-200/20">
            <img src="/logo-icon.png" alt="Pasaporte Virtual NFC" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight text-white leading-tight">
              Administración
            </p>
            <p className="text-[10px] font-semibold text-teal-400 tracking-wider uppercase">
              Pasaporte NFC
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-1.5 px-4 py-4 flex-1 overflow-y-auto">
          {nav}
        </nav>
      </aside>

      {/* Contenedor Principal (con margen izquierdo para el sidebar desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Barra Superior Header */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          {/* Barra de búsqueda con atajo */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md hidden sm:block"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuarios, locales, tarjetas..."
              className="w-full pl-10 pr-14 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500/40 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 transition placeholder:text-slate-400 outline-none"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-400 shadow-2xs pointer-events-none">
              <span>⌘</span>
              <span>K</span>
            </div>
          </form>

          {/* Logo en Mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center shadow-sm">
              <img src="/logo-icon.png" alt="Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold text-xs tracking-tight">Admin NFC</span>
          </div>

          {/* Perfil y Notificaciones a la derecha */}
          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones Interactiva */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl transition ${
                  notifOpen
                    ? "bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Centro de notificaciones y pendientes"
              >
                <Bell className="w-4 h-4" />
                {(notificaciones?.total_pendientes ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                    {notificaciones?.total_pendientes}
                  </span>
                )}
              </button>

              {/* Popover Notificaciones */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>Pendientes de Atención</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {notificaciones?.total_pendientes ?? 0} acciones requieren tu revisión
                      </p>
                    </div>
                    {(notificaciones?.total_pendientes ?? 0) > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                        {notificaciones?.total_pendientes} activos
                      </span>
                    )}
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Canjes Pendientes */}
                    {(notificaciones?.canjes_pendientes_count ?? 0) > 0 && (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Canjes por Entregar ({notificaciones?.canjes_pendientes_count})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate("/admin/recompensas?tab=canjes");
                            }}
                            className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-0.5"
                          >
                            Ver todos <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {notificaciones?.canjes_pendientes.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setNotifOpen(false);
                                navigate("/admin/recompensas?tab=canjes");
                              }}
                              className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 cursor-pointer transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {c.nombre_recompensa}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  Por: <strong className="text-slate-700 dark:text-slate-300">{c.usuario_nombre}</strong> ({c.puntos_gastados} pts)
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30 shrink-0">
                                Despachar
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reclamos Pendientes */}
                    {(notificaciones?.reclamaciones_pendientes_count ?? 0) > 0 && (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Libro Reclamaciones ({notificaciones?.reclamaciones_pendientes_count})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate("/admin/reclamaciones");
                            }}
                            className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-0.5"
                          >
                            Ver todos <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {notificaciones?.reclamaciones_pendientes.map((r) => (
                            <div
                              key={r.id}
                              onClick={() => {
                                setNotifOpen(false);
                                navigate("/admin/reclamaciones");
                              }}
                              className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 cursor-pointer transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {r.tipo_registro} #{r.codigo_seguimiento}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  Reclamante: {r.nombres_reclamante}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-rose-600 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/30 shrink-0">
                                Responder
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sin pendientes */}
                    {(notificaciones?.total_pendientes ?? 0) === 0 && (
                      <div className="p-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                          <Check className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Todo está al día
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No tienes canjes ni reclamos pendientes de atención
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pill de Perfil Admin */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition"
              >
                <span className="w-7 h-7 rounded-full bg-[#0B1522] text-teal-400 font-bold text-xs flex items-center justify-center">
                  {initials(user) || "AP"}
                </span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  ADMIN
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors" />
              </button>

              {/* Dropdown Menu (Hover) */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.nombres || "Administrador"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || "admin@pasaporte.com"}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido de la vista */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* Bottom Nav Mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0B1522] text-white border-t border-slate-800 safe-area-pb overflow-x-auto z-40">
          <div className="flex justify-around min-w-max px-2 py-1">{nav}</div>
        </nav>
      </div>
    </div>
  );
};

const NavItem: React.FC<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: string;
}> = ({ to, label, icon: Icon, end, badge }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
        isActive
          ? "bg-[#132A38] text-teal-400 border border-teal-500/30 shadow-xs"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`
    }
  >
    <div className="flex items-center gap-3 truncate">
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
    {badge && (
      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
        {badge}
      </span>
    )}
  </NavLink>
);
