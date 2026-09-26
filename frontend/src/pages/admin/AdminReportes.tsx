import React, { useState } from "react";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Store, 
  Award, 
  FileSpreadsheet,
  FileText,
  PieChart
} from "lucide-react";

export const AdminReportes: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleExport = (tipo: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`Reporte consolidado (${tipo}) exportado exitosamente.`);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E]">Reportes y Analíticas</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Gráficos estadísticos y exportación formal de métricas del ecosistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("Excel")}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7C0A1E] text-white hover:bg-[#600616] transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => handleExport("PDF")}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#EFE7DE] text-[#2D1A1E] hover:bg-slate-50 transition"
          >
            <FileText className="w-4 h-4 text-[#7C0A1E]" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* 2 Gráficos Analíticos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico 1: Evolución Semanal de Visitas NFC */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Tendencia Semanal de Visitas NFC</h3>
              <p className="text-[11px] text-[#8E7D7D]">Acreditadas por trabajadores en sucursal</p>
            </div>
            <span className="text-[10px] font-bold bg-[#FAF8F5] border border-[#EFE7DE] px-2 py-1 rounded-lg text-[#8E7D7D]">
              Últimos 7 días
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
            {[
              { dia: "Lun", val: 120 },
              { dia: "Mar", val: 180 },
              { dia: "Mié", val: 240 },
              { dia: "Jue", val: 210 },
              { dia: "Vie", val: 320 },
              { dia: "Sáb", val: 410 },
              { dia: "Dom", val: 290 },
            ].map((b) => (
              <div key={b.dia} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-[#7C0A1E]">{b.val}</span>
                <div
                  style={{ height: `${(b.val / 410) * 80}%` }}
                  className="w-full bg-[#7C0A1E] hover:bg-[#600616] rounded-t-lg transition-all"
                />
                <span className="text-[10px] text-[#8E7D7D] font-medium">{b.dia}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Desglose de Canjes y Beneficios */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2D1A1E]">Distribución de Canjes por Categoría</h3>
              <p className="text-[11px] text-[#8E7D7D]">Recompensas entregadas a clientes</p>
            </div>
            <span className="text-[10px] font-bold bg-[#C5A059]/15 text-[#7C0A1E] px-2 py-1 rounded-lg font-mono">
              Consolidado
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { cat: "Bebidas y Cafetería", pct: 45, pts: "115,550 pts" },
              { cat: "Postres y Pastelería", pct: 28, pts: "71,900 pts" },
              { cat: "Descuentos en Consumo", pct: 18, pts: "46,220 pts" },
              { cat: "Premios Especiales", pct: 9, pts: "23,110 pts" },
            ].map((item) => (
              <div key={item.cat} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#2D1A1E]">{item.cat}</span>
                  <span className="text-[#8E7D7D]">{item.pts} ({item.pct}%)</span>
                </div>
                <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className="bg-[#C5A059] h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Reportes Formales */}
      <div className="bg-white rounded-3xl border border-[#EFE7DE] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#EFE7DE]">
          <h3 className="text-sm font-bold text-[#2D1A1E]">Balances y Documentos Descargables</h3>
          <p className="text-xs text-[#8E7D7D]">Exportación directa para auditoría y administración</p>
        </div>

        <div className="divide-y divide-[#EFE7DE]">
          {[
            {
              nombre: "Reporte Mensual de Visitas y Sellos por Local",
              desc: "Desglose por sucursal, trabajador validador y fecha",
              tipo: "Excel / CSV",
              fecha: "25 Sep. 2026",
            },
            {
              nombre: "Libro Contable de Movimientos de Puntos (Ledger)",
              desc: "Registro de abonos, cargos por canjes y saldos auditables",
              tipo: "Excel / PDF",
              fecha: "25 Sep. 2026",
            },
            {
              nombre: "Reporte de Tarjetas NFC Físicas y Asignaciones",
              desc: "UIDs, clientes asociados, tarjetas activas y disponibles",
              tipo: "CSV",
              fecha: "25 Sep. 2026",
            },
            {
              nombre: "Consolidado de Reclamaciones y Plazos Indecopi",
              desc: "Estados de respuesta, reclamos resueltos y pendientes (15 días)",
              tipo: "PDF",
              fecha: "25 Sep. 2026",
            },
          ].map((rep, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition">
              <div>
                <p className="text-xs font-bold text-[#2D1A1E]">{rep.nombre}</p>
                <p className="text-[11px] text-[#8E7D7D]">{rep.desc}</p>
                <span className="text-[10px] text-[#C5A059] font-semibold mt-1 inline-block">
                  Formato: {rep.tipo} · Actualizado: {rep.fecha}
                </span>
              </div>
              <button
                onClick={() => handleExport(rep.nombre)}
                className="p-2.5 rounded-xl border border-[#EFE7DE] hover:border-[#7C0A1E] bg-white text-[#7C0A1E] transition hover:scale-105"
                title="Descargar"
              >
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
