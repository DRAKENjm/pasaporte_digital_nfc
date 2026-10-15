import React, { useEffect, useState } from "react";
import { 
  Users, 
  Store, 
  Award, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Gift,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { maskEmail } from "../../utils/privacy";

export const AdminHome: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [dashRes, userRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/usuarios", { params: { rol: "CLIENTE" } }).catch(() => ({ data: { data: [] } })),
      ]);
      setData(dashRes.data.data);
      const uList = userRes.data?.data ?? userRes.data ?? [];
      setRecentClients(Array.isArray(uList) ? uList.slice(0, 5) : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Error al cargar dashboard", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-actualización cada 60 segundos
    const interval = setInterval(() => fetchDashboard(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size={36} />
        <p className="text-sm font-semibold text-[#4A3E3D]">Cargando métricas consolidadas del sistema...</p>
      </div>
    );
  }

  // Métricas reales desde PostgreSQL
  const totalClientes = data?.usuarios ?? 0;
  const totalLocales = data?.establecimientos_totales ?? 0;
  const localesActivos = data?.establecimientos_activos ?? 0;
  const totalVisitas = data?.visitas_totales ?? 0;
  const visitasHoy = data?.visitas_hoy ?? 0;
  const totalPuntos = data?.publicaciones ?? 0;
  const puntosHoy = data?.puntos_hoy ?? 0;
  const totalTarjetas = data?.tarjetas_nfc ?? 0;
  const canjesPendientes = data?.canjes_pendientes ?? 0;
  const reclamacionesPendientes = data?.reclamaciones_pendientes ?? 0;
  const actividadReciente = data?.actividad_reciente ?? [];
  const topEstablecimientos = data?.top_establecimientos ?? [];
  const tendencia7Dias = data?.tendencia_7_dias ?? [];
  const resumenNfc = data?.resumen_nfc ?? {
    total: 0,
    en_stock: 0,
    asignadas: 0,
    extraviadas: 0,
    bloqueadas: 0,
  };
  const comparativa = data?.comparativa_semanal ?? {};

  // Cálculos de variación semanal
  const visitasEstaSemana = comparativa.visitas_esta_semana ?? 0;
  const visitasSemanaAnterior = comparativa.visitas_semana_anterior ?? 0;
  const difVisitas = visitasEstaSemana - visitasSemanaAnterior;

  const clientesEstaSemana = comparativa.clientes_esta_semana ?? 0;
  const difClientes = clientesEstaSemana - (comparativa.clientes_semana_anterior ?? 0);

  // Tarjetas calculadas
  const tarjetasAsignadas = Number(resumenNfc.asignadas || 0);
  const tarjetasEnStock = Number(resumenNfc.en_stock || 0);
  const tarjetasBloqueadas = Number(resumenNfc.bloqueadas || 0) + Number(resumenNfc.extraviadas || 0);
  const baseTarjetas = Math.max(totalTarjetas, 1);
  const pctAsignadas = Math.round((tarjetasAsignadas / baseTarjetas) * 100);
  const pctEnStock = Math.round((tarjetasEnStock / baseTarjetas) * 100);
  const pctBloqueadas = Math.max(0, 100 - pctAsignadas - pctEnStock);

  // Alertas que requieren atención del administrador
  const tieneAlertas = reclamacionesPendientes > 0 || tarjetasBloqueadas > 0 || canjesPendientes > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* 1. Header Unificado (Sin títulos duplicados, Sans-Serif estricto) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D1A1E] font-sans tracking-tight">
            Resumen Operativo
          </h1>
          <p className="text-[13px] text-[#4A3E3D] mt-0.5 font-medium">
            Supervisión integral de clientes, emisión de sellos y estado de la red NFC.
          </p>
        </div>

        <div>
          <span className="text-xs font-bold text-[#8E7D7D] uppercase tracking-wider">
            {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Tarjetas KPI */}

      {/* 3. Cuatro Tarjetas KPI con Jerarquía, Contraste y Tipografía Tabular */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Clientes registrados */}
        <Link 
          to="/admin/clientes"
          className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs hover:border-[#1E3A8A]/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider">
              Clientes Registrados
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
          </div>
          
          <div className="mt-3">
            <h3 className="text-3xl font-black text-[#2D1A1E] font-mono tabular-nums tracking-tight">
              {totalClientes.toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#F0ECE6]">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <TrendingUp size={14} />
                +{clientesEstaSemana} esta semana
              </span>
              <span className="text-[11px] font-bold text-[#4A3E3D] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8DFD5]">
                Padrón activo
              </span>
            </div>
          </div>
        </Link>

        {/* KPI 2: Locales afiliados */}
        <Link 
          to="/admin/locales"
          className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs hover:border-[#B45309]/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider">
              Establecimientos
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#B45309]/10 text-[#B45309] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Store size={20} />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl font-black text-[#2D1A1E] font-mono tabular-nums tracking-tight">
              {localesActivos} <span className="text-base text-[#4A3E3D] font-medium font-sans">/ {totalLocales}</span>
            </h3>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#F0ECE6]">
              <span className="text-xs font-semibold text-[#4A3E3D]">
                {localesActivos === totalLocales ? "100% operativos" : `${totalLocales - localesActivos} en pausa`}
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Red comercial
              </span>
            </div>
          </div>
        </Link>

        {/* KPI 3: Visitas confirmadas */}
        <Link 
          to="/admin/sellos"
          className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs hover:border-[#7C0A1E]/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider">
              Visitas y Sellos
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#7C0A1E]/10 text-[#7C0A1E] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Award size={20} />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl font-black text-[#2D1A1E] font-mono tabular-nums tracking-tight">
              {totalVisitas.toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#F0ECE6]">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <TrendingUp size={14} />
                {visitasHoy > 0 ? `+${visitasHoy} hoy` : `${visitasEstaSemana} esta semana`}
              </span>
              <span className="text-[11px] font-bold text-[#7C0A1E] bg-[#7C0A1E]/10 px-2 py-0.5 rounded-md border border-[#7C0A1E]/20">
                Validación NFC
              </span>
            </div>
          </div>
        </Link>

        {/* KPI 4: Puntos acumulados */}
        <Link 
          to="/admin/reglas"
          className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs hover:border-[#065F46]/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider">
              Puntos Globales
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#065F46]/10 text-[#065F46] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl font-black text-[#2D1A1E] font-mono tabular-nums tracking-tight">
              {totalPuntos.toLocaleString()} <span className="text-sm font-sans font-bold text-[#4A3E3D]">pts</span>
            </h3>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#F0ECE6]">
              <span className="text-xs font-semibold text-emerald-700">
                +{puntosHoy} pts hoy
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                canjesPendientes > 0
                  ? "text-amber-800 bg-amber-50 border-amber-200 font-bold"
                  : "text-emerald-800 bg-emerald-50 border-emerald-200"
              }`}>
                {canjesPendientes > 0 ? `⚠ ${canjesPendientes} canjes` : "Sin canjes pendientes"}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 4. Bloque Central: Tendencia Semanal y Distribución de Tarjetas NFC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico Semanal con Días en Español y Eje Y de Referencia */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Visitas de la Semana</h3>
              <p className="text-[13px] text-[#4A3E3D] font-medium">Validaciones diarias confirmadas</p>
            </div>
            <span className="text-xs font-bold bg-[#FAF8F5] border border-[#E8DFD5] px-2.5 py-1 rounded-xl text-[#4A3E3D]">
              Semana Actual
            </span>
          </div>

          {/* Área de Gráfico con Grid Line y Tooltips */}
          <div className="relative pt-6 pb-2">
            {/* Línea de guía de referencia superior */}
            <div className="absolute top-6 left-0 right-0 border-b border-dashed border-[#E8DFD5] pointer-events-none" />

            <div className="h-44 flex items-end justify-between gap-2 px-1">
              {(tendencia7Dias.length > 0 ? tendencia7Dias : [
                { dia_nombre: "Lun", nuevos_clientes: 0 },
                { dia_nombre: "Mar", nuevos_clientes: 0 },
                { dia_nombre: "Mié", nuevos_clientes: 0 },
                { dia_nombre: "Jue", nuevos_clientes: 0 },
                { dia_nombre: "Vie", nuevos_clientes: 0 },
                { dia_nombre: "Sáb", nuevos_clientes: 0 },
                { dia_nombre: "Dom", nuevos_clientes: 0 },
              ]).map((bar: any, idx: number) => {
                const maxVal = Math.max(...tendencia7Dias.map((t: any) => t.nuevos_clientes || 0), 6);
                const count = Number(bar.nuevos_clientes) || 0;
                const heightPct = count > 0 ? Math.min(100, Math.max(16, Math.round((count / maxVal) * 100))) : 4;
                
                const diasMap: Record<string, string> = {
                  Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom",
                  Monday: "Lun", Tuesday: "Mar", Wednesday: "Mié", Thursday: "Jue", Friday: "Vie", Saturday: "Sáb", Sunday: "Dom",
                };
                const diaEtiqueta = diasMap[bar.dia_nombre] || bar.dia_nombre || "Día";

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    {/* Tooltip flotante al pasar el cursor */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 bg-[#2D1A1E] text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-md z-20">
                      {diaEtiqueta}: {count} {count === 1 ? "visita" : "visitas"}
                    </div>

                    <span className={`text-[11px] font-mono tabular-nums font-bold ${
                      count > 0 ? "text-[#7C0A1E]" : "text-[#8E7D7D]/60"
                    }`}>
                      {count}
                    </span>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all ${
                        count > 0
                          ? "bg-[#7C0A1E] hover:bg-[#5C0716] shadow-2xs"
                          : "bg-[#E8DFD5]/70"
                      }`}
                    />

                    <span className="text-xs text-[#4A3E3D] font-bold mt-0.5">{diaEtiqueta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between text-xs text-[#4A3E3D] font-medium">
            <span>Total semana: <strong className="text-[#2D1A1E] font-mono tabular-nums">{visitasEstaSemana}</strong> visitas registradas</span>
          </div>
        </div>

        {/* Control del Inventario de Tarjetas NFC (Barra Apilada Segmentada - Reemplaza Donut) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Inventario de Tarjetas NFC</h3>
              <p className="text-[13px] text-[#4A3E3D] font-medium">Distribución física y asignación a clientes</p>
            </div>
            <Link to="/admin/tarjetas" className="text-xs font-bold text-[#7C0A1E] hover:underline flex items-center gap-0.5">
              Gestionar <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* Total Grande y Barra Apilada */}
          <div className="my-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono tabular-nums text-[#2D1A1E]">
                {totalTarjetas} <span className="text-sm font-sans font-bold text-[#4A3E3D]">tarjetas registradas</span>
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {pctAsignadas}% en uso
              </span>
            </div>

            {/* Stacked Distribution Bar */}
            <div className="w-full h-4 bg-[#F0ECE6] rounded-full overflow-hidden flex shadow-inner border border-[#E8DFD5]">
              <div 
                style={{ width: `${pctAsignadas}%` }} 
                className="bg-[#065F46] transition-all" 
                title={`Activas en manos de clientes: ${tarjetasAsignadas} (${pctAsignadas}%)`}
              />
              <div 
                style={{ width: `${pctEnStock}%` }} 
                className="bg-[#B45309] transition-all" 
                title={`Disponibles en almacén: ${tarjetasEnStock} (${pctEnStock}%)`}
              />
              <div 
                style={{ width: `${pctBloqueadas}%` }} 
                className="bg-rose-500 transition-all" 
                title={`Bloqueadas / Extraviadas: ${tarjetasBloqueadas} (${pctBloqueadas}%)`}
              />
            </div>

            {/* Leyenda con Porcentajes y Datos Claros */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#F0ECE6]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#065F46] shrink-0" />
                  <span className="font-semibold text-[#4A3E3D]">Activas con clientes:</span>
                </div>
                <strong className="font-mono tabular-nums text-[#2D1A1E] text-sm">{tarjetasAsignadas} ({pctAsignadas}%)</strong>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F0ECE6]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#B45309] shrink-0" />
                  <span className="font-semibold text-[#4A3E3D]">Disponibles en stock:</span>
                </div>
                <strong className="font-mono tabular-nums text-[#2D1A1E] text-sm">{tarjetasEnStock} ({pctEnStock}%)</strong>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-semibold text-[#4A3E3D]">Bloqueadas / Pérdidas:</span>
                </div>
                <strong className="font-mono tabular-nums text-[#2D1A1E] text-sm">{tarjetasBloqueadas} ({pctBloqueadas}%)</strong>
              </div>
            </div>
          </div>

          <Link
            to="/admin/tarjetas"
            className="w-full py-2.5 bg-[#FAF8F5] border border-[#E8DFD5] rounded-xl text-center text-xs font-bold text-[#7C0A1E] hover:bg-rose-50 transition-colors shadow-2xs"
          >
            + Registrar o vincular nuevo lote NFC
          </Link>
        </div>

        {/* Locales con Mayor Registro de Visitas */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Locales Destacados</h3>
              <p className="text-[13px] text-[#4A3E3D] font-medium">Mayor afluencia de visitas validadas</p>
            </div>
            <Link to="/admin/locales" className="text-xs font-bold text-[#7C0A1E] hover:underline flex items-center gap-0.5">
              Ver todos <ArrowUpRight size={13} />
            </Link>
          </div>

          {topEstablecimientos.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#4A3E3D] flex flex-col items-center justify-center">
              <Store className="w-9 h-9 text-[#8E7D7D]/40 mb-2" />
              <p className="font-semibold">No hay visitas registradas en locales aún.</p>
              <Link to="/admin/locales" className="text-[#7C0A1E] font-bold mt-2 hover:underline">
                + Explorar comercios y lugares
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5 my-2">
              {topEstablecimientos.slice(0, 4).map((e: any, idx: number) => {
                const maxTop = Math.max(...topEstablecimientos.map((t: any) => t.total_sellos || 0), 1);
                const widthPct = Math.min(100, Math.max(12, Math.round(((e.total_sellos || 0) / maxTop) * 100)));

                return (
                  <div key={e.id || idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[180px]">
                        <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8DFD5] text-[10px] font-bold text-[#7C0A1E] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#2D1A1E] truncate">{e.nombre}</span>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-[#7C0A1E]">
                        {e.total_sellos ?? 0} {e.total_sellos === 1 ? "visita" : "visitas"}
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF8F5] h-2.5 rounded-full overflow-hidden border border-[#E8DFD5]">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="bg-[#7C0A1E] h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between text-xs text-[#4A3E3D] font-medium">
            <span>Red oficial auditada</span>
            <span className="font-bold text-[#B45309]">Emisión Notarial</span>
          </div>
        </div>
      </div>

      {/* 5. Bloque Inferior: Últimos Clientes (Ley 29733), Actividad Reciente y Accesos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Últimos registros de clientes (Con enmascaramiento PII Ley 29733) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#2D1A1E]">Últimos Clientes Registrados</h3>
              <Link to="/admin/clientes" className="text-xs font-bold text-[#7C0A1E] hover:underline">
                Ver padrón
              </Link>
            </div>
            <p className="text-[12px] text-[#5A4B4B] mb-3 font-medium">
              Correos protegidos bajo Ley N° 29733 (Perú)
            </p>

            {recentClients.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#4A3E3D]">
                <Users className="w-8 h-8 text-[#8E7D7D]/40 mx-auto mb-2" />
                <p className="font-semibold">No hay clientes registrados aún.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0ECE6]">
                {recentClients.map((cl: any) => (
                  <div key={cl.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-black text-xs flex items-center justify-center shrink-0">
                        {cl.nombres?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D1A1E] truncate">
                          {cl.nombres} {cl.apellidos || ""}
                        </p>
                        <p className="text-[11px] font-mono text-[#5A4B4B] truncate">
                          {maskEmail(cl.email)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 size={10} /> Activo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between text-xs text-[#4A3E3D]">
            <span>Protección de datos personales</span>
            <span className="font-bold text-emerald-700">Conforme Ley 29733</span>
          </div>
        </div>

        {/* Actividad Reciente (Misma altura estructurada con scroll interno y estado vacío profesional) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#2D1A1E]">Actividad Reciente</h3>
              <Link to="/admin/sellos" className="text-xs font-bold text-[#7C0A1E] hover:underline">
                Historial sellos
              </Link>
            </div>
            <p className="text-[13px] text-[#4A3E3D] font-medium mb-3">
              Últimas validaciones de pasaporte digital
            </p>

            {actividadReciente.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#4A3E3D] flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-[#8E7D7D]/40 mb-2" />
                <p className="font-bold text-[#2D1A1E]">Sin validaciones registradas hoy</p>
                <p className="text-[11px] text-[#5A4B4B] mt-1 max-w-[220px]">
                  Las lecturas de tarjetas físicas NFC y sellos de locales aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y divide-[#F0ECE6] pr-1">
                {actividadReciente.slice(0, 6).map((act: any, idx: number) => (
                  <div key={act.id || idx} className="pt-2 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#7C0A1E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-[#7C0A1E]/20">
                      <Award size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-[#2D1A1E] truncate">
                        {act.usuario_nombre || "Cliente"}
                      </p>
                      <p className="text-[11px] text-[#4A3E3D] truncate">
                        {act.establecimiento_nombre} · <strong className="text-[#7C0A1E]">+{act.puntos_ganados || 20} pts</strong>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[#5A4B4B] whitespace-nowrap">
                      {act.fecha_hora 
                        ? new Date(act.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
                        : "Hoy"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between text-xs text-[#4A3E3D]">
            <span>Registro criptográfico</span>
            <span className="font-bold text-[#7C0A1E]">NFC Seguro</span>
          </div>
        </div>

        {/* Accesos Rápidos de Administración */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2D1A1E] mb-0.5">Operaciones de Plataforma</h3>
            <p className="text-[13px] text-[#4A3E3D] font-medium mb-3">Acciones directas para la configuración</p>
            
            <div className="space-y-2">
              <Link
                to="/admin/locales"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#E8DFD5] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white text-[#7C0A1E] shadow-2xs border border-[#E8DFD5]">
                    <Store size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D1A1E] block">Nuevo local o lugar</span>
                    <span className="text-[11px] text-[#5A4B4B]">Afiliar comercio o patrimonio</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D] group-hover:text-[#7C0A1E] transition-colors" />
              </Link>

              <Link
                to="/admin/tarjetas"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#E8DFD5] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white text-[#B45309] shadow-2xs border border-[#E8DFD5]">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D1A1E] block">Lotes de tarjetas NFC</span>
                    <span className="text-[11px] text-[#5A4B4B]">Alta física y stock disponible</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D] group-hover:text-[#B45309] transition-colors" />
              </Link>

              <Link
                to="/admin/reglas"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#E8DFD5] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white text-[#065F46] shadow-2xs border border-[#E8DFD5]">
                    <Award size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D1A1E] block">Gestión de Puntos</span>
                    <span className="text-[11px] text-[#5A4B4B]">Reglas por local y lugar</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D] group-hover:text-[#065F46] transition-colors" />
              </Link>

              <Link
                to="/admin/reclamaciones"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-rose-50 border border-[#E8DFD5] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white text-rose-700 shadow-2xs border border-[#E8DFD5]">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D1A1E] block">Libro de Reclamaciones</span>
                    <span className="text-[11px] text-[#5A4B4B]">Cumplimiento legal INDECOPI</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8E7D7D] group-hover:text-rose-700 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
