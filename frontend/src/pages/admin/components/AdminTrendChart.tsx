import React, { useState } from "react";
import { TendenciaDiaItem } from "../../../types/admin";
import { TrendingUp, Calendar, Zap } from "lucide-react";

interface Props {
  data: TendenciaDiaItem[];
}

export const AdminTrendChart: React.FC<Props> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Asegurar siempre 7 días formateados
  const items = data && data.length > 0 ? data : [];
  const maxVisitas = Math.max(...items.map((d) => d.total_visitas), 5);

  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 30;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Calcular coordenadas para línea y puntos
  const points = items.map((item, idx) => {
    const x =
      items.length > 1
        ? paddingX + (idx / (items.length - 1)) * usableWidth
        : paddingX + usableWidth / 2;
    const y =
      paddingY +
      usableHeight -
      (item.total_visitas / maxVisitas) * usableHeight;
    return { x, y, item };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(" ")
      : "";

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : "";

  const totalSemana = items.reduce((acc, curr) => acc + curr.total_visitas, 0);
  const totalPuntosSemana = items.reduce((acc, curr) => acc + curr.total_puntos, 0);

  return (
    <div className="bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
      {/* Header del gráfico */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[rgb(var(--app-text))]">
              Tendencia de Sellos y Visitas
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Actividad de validaciones en los últimos 7 días
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {totalSemana} sellos esta semana
          </span>
          <p className="text-[11px] text-muted mt-1 flex items-center justify-end gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            {totalPuntosSemana.toLocaleString()} pts acumulados
          </p>
        </div>
      </div>

      {/* Gráfico SVG interactivo */}
      <div className="relative w-full overflow-hidden">
        {items.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-muted">
            <Calendar className="w-4 h-4 mr-2" /> Sin datos registrados en el periodo
          </div>
        ) : (
          <div className="w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Líneas de guía horizontales */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={paddingY + usableHeight / 2}
                x2={chartWidth - paddingX}
                y2={paddingY + usableHeight / 2}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />

              {/* Área sombreada */}
              <path d={areaD} fill="url(#areaGradient)" />

              {/* Línea principal */}
              <path
                d={pathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Puntos interactivos con hover */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Línea vertical guía en hover */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={paddingY}
                        x2={p.x}
                        y2={chartHeight - paddingY}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.7"
                      />
                    )}

                    {/* Círculo del punto */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4}
                      className="fill-sky-500 stroke-[rgb(var(--app-card))] transition-all"
                      strokeWidth="2"
                    />

                    {/* Etiqueta del día eje X */}
                    <text
                      x={p.x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className={`text-[11px] select-none font-medium ${
                        isHovered
                          ? "fill-sky-500 font-bold"
                          : "fill-slate-500 dark:fill-slate-400"
                      }`}
                    >
                      {p.item.dia_nombre || p.item.fecha.slice(5)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip flotante informativo */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between shadow-lg border border-slate-800"
              >
                <div>
                  <span className="font-semibold text-sky-400">
                    {points[hoveredIndex].item.fecha} ({points[hoveredIndex].item.dia_nombre})
                  </span>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-300">
                    <span>
                      🔵 <strong>{points[hoveredIndex].item.visitas_nfc}</strong> NFC
                    </span>
                    <span>
                      🟣 <strong>{points[hoveredIndex].item.visitas_qr}</strong> QR
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-white">
                    {points[hoveredIndex].item.total_visitas} sellos
                  </div>
                  <div className="text-[11px] text-amber-400 font-medium">
                    +{points[hoveredIndex].item.total_puntos} pts
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
