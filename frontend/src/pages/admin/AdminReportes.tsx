import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  Store, 
  Stamp, 
  FileSpreadsheet,
  FileText,
  PieChart,
  Coins,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ReporteData {
  tendencia_visitas: Array<{ dia: string; fecha_corta: string; val: number }>;
  distribucion_canjes: Array<{ cat: string; canjes_count: number; puntos_totales: number }>;
  resumen: {
    total_visitas: number;
    total_sellos: number;
    puntos_emitidos: number;
    puntos_canjeados: number;
    locales_activos: number;
    total_clientes: number;
    canjes_pendientes: number;
    tarjetas_activas: number;
  };
}

export const AdminReportes: React.FC = () => {
  const [data, setData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useUI();

  const loadReportes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reportes");
      setData(res.data.data);
    } catch {
      showToast("Error al cargar datos de reportes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportes();
  }, []);

  const handleExportar = async (tipo: "visitas" | "movimientos" | "tarjetas" | "reclamaciones") => {
    setDownloading(true);
    try {
      const res = await api.get(`/admin/reportes/exportar/${tipo}`);
      const { filename, data: rows } = res.data.data;
      if (!rows || rows.length === 0) {
        showToast("No hay registros en este reporte para exportar", "info");
        return;
      }
      
      const headers = Object.keys(rows[0]);
      const csvRows = [
        headers.join(","),
        ...rows.map((row: any) =>
          headers
            .map((header) => {
              const val = row[header] ?? "";
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ];

      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Reporte descargado exitosamente", "success");
    } catch {
      showToast("Error al exportar el reporte", "error");
    } finally {
      setDownloading(false);
    }
  };

  const tendencia = data?.tendencia_visitas || [];
  const maxValTendencia = Math.max(...tendencia.map((t) => t.val), 1);
  const canjesDistribucion = data?.distribucion_canjes || [];
  const totalPuntosCanjes = canjesDistribucion.reduce((acc, c) => acc + Number(c.puntos_totales || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7C0A1E] font-bold text-xs tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Auditoría & Análisis en Tiempo Real</span>
          </div>
          <h1 className="text-2xl font-black text-[#2D1A1E]">Reportes y Analíticas</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Métricas 100% reales consolidadas desde la base de datos oficial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportar("visitas")}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7C0A1E] text-white hover:bg-[#600616] transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Visitas (Excel/CSV)</span>
          </button>
          <button
            onClick={() => handleExportar("movimientos")}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#EFE7DE] text-[#2D1A1E] hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <FileText className="w-4 h-4 text-[#7C0A1E]" />
            <span>Exportar Puntos (Ledger)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size={36} />
          <p className="text-xs text-[#8E7D7D] font-medium">Calculando analíticas en vivo...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas Clave Reales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Visitas Totales</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#2D1A1E] mt-1.5">{data?.resumen?.total_visitas ?? 0}</p>
              <p className="text-[10px] text-muted mt-0.5">Acreditadas mediante NFC</p>
            </div>

            <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Sellos Estampados</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#7C0A1E] flex items-center justify-center">
                  <Stamp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#7C0A1E] mt-1.5">{data?.resumen?.total_sellos ?? 0}</p>
              <p className="text-[10px] text-muted mt-0.5">En pasaportes de clientes</p>
            </div>

            <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Puntos Emitidos</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-700 mt-1.5">{data?.resumen?.puntos_emitidos ?? 0}</p>
              <p className="text-[10px] text-muted mt-0.5">Puntos acumulados globales</p>
            </div>

            <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Locales Afiliados</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#2D1A1E] mt-1.5">{data?.resumen?.locales_activos ?? 0}</p>
              <p className="text-[10px] text-muted mt-0.5">{data?.resumen?.tarjetas_activas ?? 0} tarjetas activas</p>
            </div>
          </div>

          {/* 2 Gráficos Analíticos Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gráfico 1: Evolución Semanal Real de Visitas NFC */}
            <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2D1A1E]">Tendencia Semanal de Visitas NFC</h3>
                  <p className="text-[11px] text-[#8E7D7D]">Acreditadas por fecha real en los últimos 7 días</p>
                </div>
                <span className="text-[10px] font-bold bg-[#FAF8F5] border border-[#EFE7DE] px-2.5 py-1 rounded-lg text-[#8E7D7D]">
                  Últimos 7 días
                </span>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100">
                {tendencia.map((b, i) => {
                  const heightPct = b.val > 0 ? Math.max(15, (b.val / maxValTendencia) * 85) : 4;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className={`text-[10px] font-bold ${b.val > 0 ? "text-[#7C0A1E]" : "text-slate-300"}`}>
                        {b.val}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          b.val > 0 ? "bg-[#7C0A1E] hover:bg-[#600616]" : "bg-slate-100"
                        }`}
                        title={`${b.dia} (${b.fecha_corta}): ${b.val} visitas`}
                      />
                      <span className="text-[10px] text-[#8E7D7D] font-medium">{b.dia}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted text-center pt-2">Datos calculados en base a registros de visitas en PostgreSQL</p>
            </div>

            {/* Gráfico 2: Desglose Real de Canjes y Beneficios */}
            <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2D1A1E]">Distribución de Canjes por Categoría</h3>
                  <p className="text-[11px] text-[#8E7D7D]">Premios reclamados por los clientes</p>
                </div>
                <span className="text-[10px] font-bold bg-[#C5A059]/15 text-[#7C0A1E] px-2 py-1 rounded-lg font-mono">
                  Datos Reales
                </span>
              </div>

              {canjesDistribucion.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <PieChart className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-[#2D1A1E]">Aún no hay canjes registrados</p>
                  <p className="text-[11px] text-[#8E7D7D] max-w-xs mx-auto">
                    Cuando los clientes canjeen recompensas con sus puntos, aquí se reflejará la distribución automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {canjesDistribucion.map((item, idx) => {
                    const pct = totalPuntosCanjes > 0 ? Math.round((Number(item.puntos_totales) / totalPuntosCanjes) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[#2D1A1E]">{item.cat}</span>
                          <span className="text-[#8E7D7D]">
                            {item.puntos_totales} pts ({pct}%) · {item.canjes_count} canje(s)
                          </span>
                        </div>
                        <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(5, pct)}%` }}
                            className="bg-[#C5A059] h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted text-center pt-2">Puntos redimidos acumulados</p>
            </div>
          </div>

          {/* Tabla de Reportes Formales Descargables */}
          <div className="bg-white rounded-3xl border border-[#EFE7DE] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#EFE7DE] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#2D1A1E]">Balances y Documentos Descargables</h3>
                <p className="text-xs text-[#8E7D7D]">Descarga archivos CSV compatibles con Microsoft Excel y hojas de cálculo</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Datos Oficiales
              </span>
            </div>

            <div className="divide-y divide-[#EFE7DE]">
              {[
                {
                  id: "visitas" as const,
                  nombre: "Reporte de Visitas y Sellos por Local",
                  desc: "Desglose detallado por sucursal, cliente, fecha y método de validación NFC",
                  tipo: "Excel / CSV",
                },
                {
                  id: "movimientos" as const,
                  nombre: "Libro Contable de Movimientos de Puntos (Ledger)",
                  desc: "Registro de abonos, cargos por canjes de premios y saldos de puntos",
                  tipo: "Excel / CSV",
                },
                {
                  id: "tarjetas" as const,
                  nombre: "Reporte de Tarjetas NFC Físicas y Asignaciones",
                  desc: "UIDs NFC, tarjetas activas, disponibles y clientes titulares vinculados",
                  tipo: "Excel / CSV",
                },
                {
                  id: "reclamaciones" as const,
                  nombre: "Consolidado de Reclamaciones (Libro de Reclamaciones)",
                  desc: "Auditoría formal de quejas, reclamos y plazos de atención",
                  tipo: "Excel / CSV",
                },
              ].map((rep) => (
                <div key={rep.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-bold text-[#2D1A1E]">{rep.nombre}</p>
                    <p className="text-[11px] text-[#8E7D7D] mt-0.5">{rep.desc}</p>
                    <span className="text-[10px] text-[#C5A059] font-bold mt-1 inline-block">
                      Formato: {rep.tipo}
                    </span>
                  </div>
                  <button
                    onClick={() => handleExportar(rep.id)}
                    disabled={downloading}
                    className="p-2.5 rounded-xl border border-[#EFE7DE] hover:border-[#7C0A1E] bg-white text-[#7C0A1E] transition hover:scale-105 shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                    title={`Descargar ${rep.nombre}`}
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
