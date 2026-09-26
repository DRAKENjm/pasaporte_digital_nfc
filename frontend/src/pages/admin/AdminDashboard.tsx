import React, { useEffect, useState } from "react";
import {
  Users,
  Building2,
  CreditCard,
  Award,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Gift,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  MapPin,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { useUI } from "../../hooks/useUI";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useUI();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data?.data ?? res.data ?? {});
    } catch {
      showToast("Error cargando métricas del sistema", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size={36} />
        <p className="text-xs text-slate-400 mt-4 font-medium tracking-wide">
          Sincronizando métricas en tiempo real...
        </p>
      </div>
    );
  }

  const usuarios = data?.usuarios ?? 0;
  const establecimientos = data?.establecimientos_activos ?? 0;
  const visitas = data?.visitas_totales ?? 0;
  const puntosHoy = data?.puntos_hoy ?? 0;
  const canjesTotales = data?.canjes_totales ?? 0;
  const tarjetasNfc = data?.tarjetas_nfc ?? 0;
  const actividad = Array.isArray(data?.actividad_reciente) ? data.actividad_reciente : [];
  const topLocales = Array.isArray(data?.top_establecimientos) ? data.top_establecimientos : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-6">
      {/* Top Title & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#2D1A1E] tracking-tight">
            Métricas de la Red Pasaporte
          </h2>
          <p className="text-xs text-[#8E7D7D] mt-0.5 font-medium">
            Supervisión global de clientes, sellos NFC y canjes en establecimientos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F5EFEB] border border-[#E8DFD5] text-xs font-bold text-[#5A4B4B] hover:text-[#7C0A1E] transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7C0A1E]" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Grid Superior: Hero Feature Card + Right Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Hero Card (Large feature with rich burgundy gradient & stat pill) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#7C0A1E] via-[#630717] to-[#45030E] border border-[#9B1B30]/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[340px] text-white">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top content */}
          <div className="relative z-10 max-w-md space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-[#E8D3A2]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Fidelización & NFC Inteligente
            </span>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              Controla las Métricas de tu Red
            </h3>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
              Monitorea clientes activos, visitas validadas en comercios y stock de tarjetas NFC en tiempo real.
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate("/admin/clientes")}
                className="px-5 py-2.5 rounded-2xl bg-white text-[#7C0A1E] hover:bg-[#FAF8F5] font-black text-xs transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                Ver Clientes Activos
              </button>
            </div>
          </div>

          {/* Floating Pill Banner (Glassmorphism stat pill) */}
          <div className="relative z-10 mt-6 bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            <div className="space-y-0.5 border-r border-white/15 pr-2">
              <p className="text-lg sm:text-2xl font-black text-white tabular-nums">
                {usuarios.toLocaleString("es-PE")}
              </p>
              <p className="text-[11px] text-white/70 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-300 inline-block" />
                Clientes
              </p>
            </div>

            <div className="space-y-0.5 border-r border-white/15 pr-2">
              <p className="text-lg sm:text-2xl font-black text-white tabular-nums">
                {establecimientos.toLocaleString("es-PE")}
              </p>
              <p className="text-[11px] text-white/70 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
                Locales
              </p>
            </div>

            <div className="space-y-0.5 border-r border-white/15 pr-2">
              <p className="text-lg sm:text-2xl font-black text-[#E8D3A2] tabular-nums">
                {visitas.toLocaleString("es-PE")}
              </p>
              <p className="text-[11px] text-white/70 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] inline-block" />
                Visitas Totales
              </p>
            </div>

            <div className="space-y-0.5">
              <p className="text-lg sm:text-2xl font-black text-white tabular-nums">
                {tarjetasNfc.toLocaleString("es-PE")}
              </p>
              <p className="text-[11px] text-white/70 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-300 inline-block" />
                Tarjetas NFC
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Sleek Metric Widgets */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Active Activity Curve */}
          <div className="bg-white border border-[#E8DFD5] rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-44">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#2D1A1E] flex items-center gap-1.5">
                Visitas & Actividad 💡
              </p>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7C0A1E]/10 text-[#7C0A1E] border border-[#7C0A1E]/20">
                +18% este mes
              </span>
            </div>

            {/* Custom SVG Mini Curve with Tinto & Gold tones */}
            <div className="py-2">
              <svg className="w-full h-16 overflow-visible" viewBox="0 0 240 60">
                <defs>
                  <linearGradient id="gradCurveTinto" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7C0A1E" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#7C0A1E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 Q40,15 80,35 T160,20 T240,10"
                  fill="none"
                  stroke="#7C0A1E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,50 Q45,35 90,48 T170,30 T240,25"
                  fill="none"
                  stroke="#C5A059"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <circle cx="210" cy="14" r="4" fill="#7C0A1E" className="animate-ping" />
                <circle cx="210" cy="14" r="3.5" fill="#C5A059" />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8E7D7D] font-bold px-1">
              <span>Lun</span>
              <span>Mié</span>
              <span>Vie</span>
              <span className="text-[#7C0A1E] font-black">Hoy</span>
            </div>
          </div>

          {/* Card 2: Recompensas y Canjes Widget */}
          <div className="bg-white border border-[#E8DFD5] rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E7D7D] block">
                Puntos & Recompensas
              </span>
              <p className="text-2xl font-black text-[#7C0A1E] tabular-nums">
                +{puntosHoy.toLocaleString("es-PE")} <span className="text-xs text-[#8E7D7D] font-semibold">pts hoy</span>
              </p>
              <p className="text-[11px] text-[#5A4B4B] font-medium">
                {canjesTotales} canjes canjeados a la fecha
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-[#7C0A1E]/10 border border-[#7C0A1E]/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Gift className="w-7 h-7 text-[#7C0A1E]" />
            </div>
          </div>
        </div>
      </div>

      {/* Seccion Inferior: Tabla de Actividad Reciente & Top Locales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Actividad Reciente (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E8DFD5] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-sm font-bold text-[#2D1A1E] tracking-wide">
                Últimas Visitas y Validaciones NFC
              </h4>
              <p className="text-[11px] text-[#8E7D7D]">
                Registros confirmados en terminales afiliados
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/reportes")}
              className="text-xs font-bold text-[#7C0A1E] hover:text-[#9B1B30] flex items-center gap-1 transition-colors"
            >
              <span>Ver reporte</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {actividad.length === 0 ? (
            <div className="py-12 text-center text-[#8E7D7D] text-xs">
              No hay visitas registradas recientemente
            </div>
          ) : (
            <div className="space-y-2.5">
              {actividad.slice(0, 5).map((act: any) => (
                <div
                  key={act.id}
                  className="bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#E8DFD5] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#7C0A1E]/10 border border-[#7C0A1E]/20 flex items-center justify-center text-[#7C0A1E] font-black text-xs shrink-0">
                      {act.usuario_nombre?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2D1A1E] truncate">
                        {act.usuario_nombre}
                      </p>
                      <p className="text-[11px] text-[#8E7D7D] flex items-center gap-1 truncate font-medium">
                        <MapPin className="w-3 h-3 text-[#7C0A1E]" />
                        {act.establecimiento_nombre}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{act.puntos_ganados || 20} pts
                      </span>
                      <p className="text-[10px] text-[#8E7D7D] mt-0.5 font-mono">
                        {act.fecha_hora
                          ? new Date(act.fecha_hora).toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Reciente"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Locales Afiliados (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E8DFD5] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#2D1A1E] tracking-wide">
                Locales Más Activos
              </h4>
              <button
                onClick={() => navigate("/admin/locales")}
                className="text-[11px] text-[#8E7D7D] hover:text-[#7C0A1E] font-semibold"
              >
                Ver todos
              </button>
            </div>

            {topLocales.length === 0 ? (
              <div className="py-8 text-center text-[#8E7D7D] text-xs">
                Sin datos de establecimientos aún
              </div>
            ) : (
              <div className="space-y-3">
                {topLocales.slice(0, 4).map((loc: any, idx: number) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center text-xs font-black text-[#7C0A1E]">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D1A1E] truncate">
                          {loc.nombre}
                        </p>
                        <p className="text-[10px] text-[#8E7D7D]">
                          {loc.total_sellos ?? 0} visitas validadas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#C5A059] shrink-0 font-mono">
                      {loc.total_puntos ?? 0} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E8DFD5] mt-4">
            <button
              onClick={() => navigate("/admin/tarjetas")}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#E8DFD5] text-xs font-bold text-[#2D1A1E] hover:text-[#7C0A1E] transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#7C0A1E]" />
              <span>Gestionar Tarjetas NFC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

