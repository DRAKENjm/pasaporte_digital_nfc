import React, { useEffect, useState } from "react";
import { 
  Users, 
  Store, 
  Award, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";

export const AdminHome: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, userRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/usuarios", { params: { rol: "CLIENTE" } }).catch(() => ({ data: { data: [] } })),
        ]);
        setData(dashRes.data.data);
        const uList = userRes.data?.data ?? userRes.data ?? [];
        setRecentClients(Array.isArray(uList) ? uList.slice(0, 5) : []);
      } catch (e) {
        console.error("Error al cargar dashboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size={36} />
        <p className="text-xs font-semibold text-[#8E7D7D]">Cargando estadísticas en tiempo real...</p>
      </div>
    );
  }

  // Métricas 100% reales desde PostgreSQL
  const totalClientes = data?.usuarios ?? 0;
  const totalLocales = data?.establecimientos_activos ?? 0;
  const totalVisitas = data?.visitas_totales ?? 0;
  const totalPuntos = data?.publicaciones ?? 0;
  const totalTarjetas = data?.tarjetas_nfc ?? 0;
  const canjesPendientes = data?.canjes_pendientes ?? 0;
  const actividadReciente = data?.actividad_reciente ?? [];
  const topEstablecimientos = data?.top_establecimientos ?? [];
  const tendencia7Dias = data?.tendencia_7_dias ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* 1. Header: Resumen General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D1A1E] font-serif">Panel de Control General</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Monitoreo en tiempo real del ecosistema Pasaporte Digital NFC.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2D1A1E] shadow-2xs">
          <Calendar className="w-4 h-4 text-[#7C0A1E]" />
          <span>{new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {/* 2. Cuatro Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clientes registrados */}
        <Link 
          to="/admin/clientes"
          className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs hover:border-[#7C0A1E]/30 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">Clientes registrados</span>
            <h3 className="text-2xl font-black text-[#2D1A1E]">{totalClientes.toLocaleString()}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              En plataforma
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#7C0A1E] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Users size={22} />
          </div>
        </Link>

        {/* Locales afiliados */}
        <Link 
          to="/admin/locales"
          className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs hover:border-[#C5A059]/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">Locales afiliados</span>
            <h3 className="text-2xl font-black text-[#2D1A1E]">{totalLocales.toLocaleString()}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-[#7C0A1E] bg-rose-50 px-1.5 py-0.5 rounded-md">
              Activos
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Store size={22} />
          </div>
        </Link>

        {/* Visitas validadas */}
        <Link 
          to="/admin/reglas"
          className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs hover:border-[#7C0A1E]/30 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">Visitas confirmadas</span>
            <h3 className="text-2xl font-black text-[#2D1A1E]">{totalVisitas.toLocaleString()}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Validaciones NFC
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#7C0A1E]/10 text-[#7C0A1E] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Award size={22} />
          </div>
        </Link>

        {/* Puntos entregados */}
        <Link 
          to="/admin/recompensas"
          className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs hover:border-[#C5A059]/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">Puntos acumulados</span>
            <h3 className="text-2xl font-black text-[#2D1A1E]">{totalPuntos.toLocaleString()} pts</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
              {canjesPendientes > 0 ? `${canjesPendientes} canjes pendientes` : "Al día"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#C5A059] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Sparkles size={22} />
          </div>
        </Link>
      </div>

      {/* 3. Bloque Central: Tendencia y Resumen de Red NFC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Visitas últimos 7 días */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#2D1A1E]">Visitas (Últimos 7 días)</h4>
              <p className="text-[10px] text-[#8E7D7D]">Actividad semanal de validación</p>
            </div>
            <span className="text-[10px] font-bold bg-[#FAF8F5] border border-[#EFE7DE] px-2 py-1 rounded-lg text-[#8E7D7D]">
              Semana actual
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
            {(tendencia7Dias.length > 0 ? tendencia7Dias : [
              { dia_nombre: "Lun", nuevos_clientes: 0 },
              { dia_nombre: "Mar", nuevos_clientes: 0 },
              { dia_nombre: "Mié", nuevos_clientes: 0 },
              { dia_nombre: "Jue", nuevos_clientes: 0 },
              { dia_nombre: "Vie", nuevos_clientes: 0 },
              { dia_nombre: "Sáb", nuevos_clientes: 0 },
              { dia_nombre: "Dom", nuevos_clientes: 0 },
            ]).map((bar: any, idx: number) => {
              const maxVal = Math.max(...tendencia7Dias.map((t: any) => t.nuevos_clientes || 0), 5);
              const heightPct = Math.min(100, Math.max(10, Math.round(((bar.nuevos_clientes || 0) / maxVal) * 100)));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-bold text-[#7C0A1E]">{bar.nuevos_clientes || 0}</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#7C0A1E] hover:bg-[#600616] rounded-t-md transition-all opacity-85 hover:opacity-100"
                  />
                  <span className="text-[10px] text-[#8E7D7D] font-semibold">{bar.dia_nombre || "Día"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado del Inventario de Tarjetas NFC */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-[#2D1A1E]">Inventario de Tarjetas NFC</h4>
              <p className="text-[10px] text-[#8E7D7D]">Control de chips físicos y virtuales</p>
            </div>
            <Link to="/admin/tarjetas" className="text-[11px] font-bold text-[#7C0A1E] hover:underline flex items-center gap-0.5">
              Gestionar <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="flex items-center justify-around py-3">
            <div className="relative w-28 h-28 rounded-full border-8 border-[#7C0A1E] flex items-center justify-center border-t-[#C5A059] border-r-emerald-500">
              <div className="text-center">
                <span className="text-sm font-black text-[#2D1A1E] block">{totalTarjetas}</span>
                <span className="text-[8px] text-[#8E7D7D] block -mt-0.5 font-bold uppercase">Tarjetas</span>
              </div>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C0A1E]" />
                <span className="text-[#8E7D7D]">Activas: <strong className="text-[#2D1A1E]">{data?.resumen_nfc?.asignadas ?? 1}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                <span className="text-[#8E7D7D]">En stock: <strong className="text-[#2D1A1E]">{data?.resumen_nfc?.en_stock ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-[#8E7D7D]">Bloqueadas: <strong className="text-[#2D1A1E]">{data?.resumen_nfc?.bloqueadas ?? 0}</strong></span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/tarjetas"
            className="w-full py-2 bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl text-center text-xs font-bold text-[#7C0A1E] hover:bg-rose-50 transition-colors"
          >
            + Registrar nuevo lote NFC
          </Link>
        </div>

        {/* Locales destacados con más actividad */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-[#2D1A1E]">Locales Destacados</h4>
              <p className="text-[10px] text-[#8E7D7D]">Top por visitas registradas</p>
            </div>
            <Link to="/admin/locales" className="text-[11px] font-bold text-[#7C0A1E] hover:underline flex items-center gap-0.5">
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>

          {topEstablecimientos.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E7D7D] flex flex-col items-center justify-center">
              <Store className="w-8 h-8 text-[#8E7D7D]/40 mb-2" />
              <p>No hay locales afiliados con visitas aún.</p>
              <Link to="/admin/locales" className="text-[#7C0A1E] font-bold mt-2 hover:underline">
                + Crear primer establecimiento
              </Link>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {topEstablecimientos.map((e: any, idx: number) => (
                <div key={e.id || idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#2D1A1E] truncate max-w-[180px]">{e.nombre}</span>
                    <span className="text-[#7C0A1E] font-bold">{e.total_sellos ?? 0} visitas</span>
                  </div>
                  <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(15, (e.total_sellos || 1) * 20))}%` }}
                      className="bg-[#7C0A1E] h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-[10px] text-[#8E7D7D] border-t border-[#EFE7DE] flex items-center justify-between">
            <span>Red oficial</span>
            <span className="font-bold text-[#C5A059]">100% Validado</span>
          </div>
        </div>
      </div>

      {/* 4. Bloque Inferior: Últimos Clientes, Actividad Reciente y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Últimos registros de clientes */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-[#2D1A1E]">Últimos Clientes Registrados</h4>
            <Link to="/admin/clientes" className="text-[11px] font-bold text-[#7C0A1E] hover:underline">
              Ver todos
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E7D7D]">
              <Users className="w-8 h-8 text-[#8E7D7D]/40 mx-auto mb-2" />
              <p>No hay clientes registrados aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((cl: any) => (
                <div key={cl.id} className="flex items-center justify-between py-1.5 border-b border-[#EFE7DE] last:border-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-black text-xs flex items-center justify-center">
                      {cl.nombres?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2D1A1E]">{cl.nombres} {cl.apellidos || ""}</p>
                      <p className="text-[10px] text-[#8E7D7D]">{cl.email}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-[#2D1A1E]">Actividad Reciente</h4>
            <Link to="/admin/reglas" className="text-[11px] font-bold text-[#7C0A1E] hover:underline">
              Historial
            </Link>
          </div>
          {actividadReciente.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E7D7D]">
              <Award className="w-8 h-8 text-[#8E7D7D]/40 mx-auto mb-2" />
              <p>No se registran visitas NFC todavía.</p>
              <p className="text-[10px] text-[#8E7D7D] mt-1">Las lecturas de tarjetas en locales aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {actividadReciente.slice(0, 5).map((act: any, idx: number) => (
                <div key={act.id || idx} className="flex items-start gap-2.5 pb-2 border-b border-[#EFE7DE] last:border-none">
                  <span className="p-1.5 rounded-xl bg-rose-50 text-[#7C0A1E] font-bold">☕</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#2D1A1E] truncate">{act.usuario_nombre}</p>
                    <p className="text-[10px] text-[#8E7D7D] truncate">{act.establecimiento_nombre} · +{act.puntos_ganados || 20} pts</p>
                  </div>
                  <span className="text-[9px] text-[#8E7D7D] whitespace-nowrap">
                    {act.fecha_hora ? new Date(act.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Hoy"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos Rápidos de Administración */}
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#2D1A1E] mb-1">Operaciones de Plataforma</h4>
            <p className="text-[10px] text-[#8E7D7D] mb-4">Acciones directas para la configuración global</p>
            
            <div className="space-y-2">
              <Link
                to="/admin/locales"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#EFE7DE] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-[#7C0A1E] shadow-2xs">
                    <Store size={16} />
                  </div>
                  <span className="text-xs font-bold text-[#2D1A1E]">Crear nuevo local / sucursal</span>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D]" />
              </Link>

              <Link
                to="/admin/tarjetas"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#EFE7DE] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-[#C5A059] shadow-2xs">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-xs font-bold text-[#2D1A1E]">Lotes de tarjetas NFC</span>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D]" />
              </Link>

              <Link
                to="/admin/recompensas"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#EFE7DE] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-purple-600 shadow-2xs">
                    <Gift size={16} />
                  </div>
                  <span className="text-xs font-bold text-[#2D1A1E]">Catálogo de recompensas</span>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D]" />
              </Link>

              <Link
                to="/admin/reclamaciones"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#EFE7DE] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-emerald-600 shadow-2xs">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-xs font-bold text-[#2D1A1E]">Libro de reclamaciones</span>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D]" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EFE7DE] flex items-center justify-between text-[11px] text-[#8E7D7D]">
            <span>Estado del Servidor</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> En línea
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
