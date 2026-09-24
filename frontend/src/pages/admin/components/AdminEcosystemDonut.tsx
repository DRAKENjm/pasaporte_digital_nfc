import React from "react";
import { AdminDashboardData } from "../../../types/admin";

interface Props {
  data: AdminDashboardData | null;
}

export const AdminEcosystemDonut: React.FC<Props> = ({ data }) => {
  const usuarios = data?.usuarios ?? 0;
  const locales = data?.establecimientos_totales ?? 0;
  const tarjetas = data?.tarjetas_nfc ?? 0;
  const recompensas = data?.canjes_totales ?? 0;
  const reclamaciones = data?.reclamaciones_pendientes ?? 0;

  const total = usuarios + locales + tarjetas + recompensas + reclamaciones;
  const safeTotal = total > 0 ? total : 1;

  const items = [
    { label: "Usuarios", count: usuarios, color: "#134E4A" }, // dark teal
    { label: "Locales", count: locales, color: "#0D9488" }, // teal
    { label: "Tarjetas NFC", count: tarjetas, color: "#5EEAD4" }, // light teal
    { label: "Recompensas", count: recompensas, color: "#A78BFA" }, // soft purple
    { label: "Reclamaciones", count: reclamaciones, color: "#1E293B" }, // dark slate
  ];

  // Cálculo de segmentos del SVG Donut
  let cumulativePercent = 0;
  const segments = items.map((item) => {
    const percent = total > 0 ? Math.round((item.count / safeTotal) * 100) : 0;
    const offset = cumulativePercent;
    cumulativePercent += percent;
    return { ...item, percent, offset };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
        Distribución del Ecosistema
      </h3>

      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Gráfico Donut SVG */}
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* Círculo base de fondo */}
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="transparent"
              stroke="#E2E8F0"
              className="dark:stroke-slate-800"
              strokeWidth="5"
            />

            {total === 0 ? (
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="transparent"
                stroke="#94A3B8"
                strokeWidth="5"
                strokeDasharray="100 0"
                opacity="0.3"
              />
            ) : (
              segments.map((seg, idx) => {
                if (seg.percent <= 0) return null;
                const circumference = 2 * Math.PI * 14;
                const strokeLength = (seg.percent / 100) * circumference;
                const strokeOffset = (seg.offset / 100) * circumference;

                return (
                  <circle
                    key={idx}
                    cx="18"
                    cy="18"
                    r="14"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="5"
                    strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                    strokeDashoffset={-strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                );
              })
            )}
          </svg>

          {/* Contador en el centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
              {total}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Leyenda a la derecha */}
        <div className="flex flex-col gap-2 flex-1 min-w-0 pr-2">
          {items.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.count / safeTotal) * 100) : 0;
            return (
              <div
                key={idx}
                className="flex items-center justify-between text-xs gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                  <span className="text-slate-400 text-[11px] w-7 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
