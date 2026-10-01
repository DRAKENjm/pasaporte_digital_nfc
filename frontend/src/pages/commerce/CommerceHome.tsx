import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ScanLine, 
  Users, 
  Award, 
  TrendingUp, 
  Store, 
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Spinner } from "../../components/common/Spinner";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { resolveImageUrl, isImageUrl } from "../../components/common/DigitalStampBadge";

export const CommerceHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/establishments/me/stats");
        setStats(res.data?.data ?? res.data);
      } catch (e) {
        console.error("Error al cargar stats del local", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size={36} />
        <p className="text-xs font-semibold text-[#8E7D7D]">Cargando panel del establecimiento...</p>
      </div>
    );
  }

  if (error || !stats) {
    return <div className="py-16 text-center text-sm text-[#8E7D7D]">No se pudo cargar el panel del establecimiento. Intenta nuevamente más tarde.</div>;
  }

  const localNombre = stats?.establecimiento?.nombre || "Mi Establecimiento";
  const sucursalNombre = stats?.establecimiento?.sucursal || "Principal";
  const logo = stats?.establecimiento?.logo;
  const categoriaIcono = stats?.establecimiento?.categoria_icono || "store";
  const categoriaNombre = stats?.establecimiento?.categoria_nombre;
  const hasLogoImage = Boolean(logo && isImageUrl(logo));
  const iconFallback = (!hasLogoImage && logo) ? logo : categoriaIcono;
  const visitasHoy = stats?.visitas_hoy ?? 0;
  const visitasTotales = stats?.visitas_mes ?? 0;
  const puntosHoy = stats?.puntos_hoy ?? 0;
  const clientesAtendidos = stats?.clientes_unicos ?? 0;
  const ultimasVisitas = stats?.ultimas_visitas ?? [];
  const tendencia7Dias = stats?.visitas_ultimos_dias ?? [];
  const recurrencia = stats?.recurrencia_clientes ?? {};
  const segmentosRecurrencia = [
    { label: "1 visita", cantidad: Number(recurrencia.una_visita) || 0, color: "bg-[#7C0A1E]" },
    { label: "2-4 visitas", cantidad: Number(recurrencia.dos_a_cuatro) || 0, color: "bg-[#C5A059]" },
    { label: "5 o más visitas", cantidad: Number(recurrencia.cinco_o_mas) || 0, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* 1. Header del Comercio con Acción Principal */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-14 h-14 rounded-2xl bg-white border border-[#EFE7DE] shadow-md flex items-center justify-center overflow-hidden shrink-0">
            {hasLogoImage ? (
              <img
                src={resolveImageUrl(logo)}
                alt={localNombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`avatar-fallback w-full h-full bg-[#7C0A1E] text-white flex items-center justify-center ${
                hasLogoImage ? "hidden" : ""
              }`}
            >
              <CategoryIcon icon={iconFallback} className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#2D1A1E] font-serif">{localNombre}</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Sede {sucursalNombre}
              </span>
            </div>
            <p className="text-xs text-[#8E7D7D] mt-0.5">
              {categoriaNombre && <span className="font-semibold text-[#7C0A1E]">{categoriaNombre} · </span>}
              Panel de control de sucursal · Métricas de visitas y lectura NFC
            </p>
          </div>
        </div>

        <Link
          to="/commerce/validar"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-black shadow-lg hover:bg-[#600616] active:scale-98 transition-all"
        >
          <ScanLine className="w-4 h-4" />
          <span>VALIDAR VISITA NFC</span>
        </Link>
      </div>

      {/* 2. Cuatro Métricas Útiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clientes atendidos */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8E7D7D] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clientes atendidos</span>
            <Users className="w-4 h-4 text-[#7C0A1E]" />
          </div>
          <p className="text-2xl font-black text-[#2D1A1E]">{clientesAtendidos}</p>
          <span className="text-[10px] font-bold text-emerald-600">Clientes únicos</span>
        </div>

        {/* Visitas totales */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8E7D7D] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Visitas confirmadas</span>
            <Award className="w-4 h-4 text-[#C5A059]" />
          </div>
          <p className="text-2xl font-black text-[#2D1A1E]">{visitasTotales}</p>
          <span className="text-[10px] text-[#8E7D7D]">Mes en curso ({visitasHoy} hoy)</span>
        </div>

        {/* Puntos entregados */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8E7D7D] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Puntos entregados</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[#2D1A1E]">{puntosHoy} pts</p>
          <span className="text-[10px] text-[#8E7D7D]">Acreditados hoy</span>
        </div>

        {/* Clientes recurrentes */}
        <div className="bg-white p-5 rounded-2xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8E7D7D] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clientes recurrentes</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#2D1A1E]">
            {clientesAtendidos > 0 ? `${Math.round((visitasTotales / clientesAtendidos) * 10) / 10}x` : "0x"}
          </p>
          <span className="text-[10px] font-bold text-emerald-600">Frecuencia promedio</span>
        </div>
      </div>

      {/* 3. Tres Gráficos Esenciales y Limpios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Visitas Últimos 7 Días */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Visitas (Últimos 7 días)</h3>
              <p className="text-[11px] text-[#8E7D7D]">Afluencia de clientes en esta sucursal</p>
            </div>
            <span className="text-[10px] font-bold bg-[#FAF8F5] border border-[#EFE7DE] px-2 py-1 rounded-lg text-[#8E7D7D]">
              Semana actual
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
            {(tendencia7Dias.length > 0 ? tendencia7Dias : [
              { dia: "Lun", total: 0 },
              { dia: "Mar", total: 0 },
              { dia: "Mié", total: 0 },
              { dia: "Jue", total: 0 },
              { dia: "Vie", total: 0 },
              { dia: "Sáb", total: 0 },
              { dia: "Dom", total: 0 },
            ]).map((b: any, idx: number) => {
              const maxV = Math.max(...tendencia7Dias.map((t: any) => Number(t.total) || 0), 1);
              const heightPct = (Number(b.total) || 0) === 0 ? 0 : Math.max(10, Math.round(((Number(b.total) || 0) / maxV) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-bold text-[#7C0A1E]">{b.total || 0}</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#7C0A1E] hover:bg-[#600616] rounded-t-lg transition-all opacity-90"
                  />
                  <span className="text-[10px] text-[#8E7D7D] font-semibold">{b.dia || "Día"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 2: Recurrencia y Fidelización */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#2D1A1E]">Recurrencia de Clientes</h3>
            <Link to="/commerce/clientes" className="text-[11px] font-bold text-[#7C0A1E] hover:underline flex items-center gap-0.5">
              Ver clientes <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="flex items-center justify-around py-3">
            <div className="w-full space-y-3">
              {segmentosRecurrencia.map((segmento) => {
                const porcentaje = clientesAtendidos > 0 ? Math.round(segmento.cantidad / clientesAtendidos * 100) : 0;
                return (
                  <div key={segmento.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8E7D7D]">{segmento.label}</span>
                      <span className="font-bold text-[#2D1A1E]">{segmento.cantidad} ({porcentaje}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#FAF8F5] overflow-hidden">
                      <div className={`h-full ${segmento.color}`} style={{ width: `${porcentaje}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#8E7D7D] border-t border-[#EFE7DE] flex items-center justify-between">
            <span>Tasa de retorno</span>
            <span className="font-bold text-emerald-600">Clientes del mes en curso</span>
          </div>
        </div>
      </div>

      {/* 4. Últimas Visitas Validadas en la Sucursal */}
      <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#2D1A1E]">Últimas Validaciones en Mostrador</h3>
            <p className="text-[11px] text-[#8E7D7D]">Registros recientes de clientes en esta sucursal</p>
          </div>
          <Link to="/commerce/historial" className="text-[11px] font-bold text-[#7C0A1E] hover:underline">
            Ver historial completo
          </Link>
        </div>

        {ultimasVisitas.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8E7D7D]">
            <Award className="w-8 h-8 text-[#8E7D7D]/40 mx-auto mb-2" />
            <p>No se han registrado visitas en esta sucursal.</p>
            <Link to="/commerce/validar" className="text-[#7C0A1E] font-bold mt-1 inline-block hover:underline">
              Abrir terminal NFC para registrar la primera visita
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#EFE7DE]">
            {ultimasVisitas.map((v: any, idx: number) => (
              <div key={v.id_visita || idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-bold text-xs flex items-center justify-center">
                    {v.nombres?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2D1A1E]">{v.nombres} {v.apellidos || ""}</p>
                    <p className="text-[10px] text-[#8E7D7D]">
                      {new Date(v.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Validación NFC
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center text-xs font-black text-[#7C0A1E] bg-rose-50 px-2.5 py-1 rounded-xl">
                    +{Number(v.sellos_otorgados) || 0} sellos · +{Number(v.puntos_otorgados) || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
