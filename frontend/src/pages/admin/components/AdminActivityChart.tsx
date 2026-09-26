import React, { useState } from "react";
import { TendenciaDiaItem } from "../../../types/admin";

interface Props {
  data: TendenciaDiaItem[];
}

export const AdminActivityChart: React.FC<Props> = ({ data }) => {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = data || [];

  const maxVal = Math.max(...items.map((d) => d.nuevos_clientes || 0));
  const yMax = maxVal < 5 ? 5 : maxVal * 1.2;

  const width = 600;
  const height = 190;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  const points = items.map((d, i) => {
    const x =
      items.length > 1
        ? paddingLeft + (i / (items.length - 1)) * usableWidth
        : paddingLeft + usableWidth / 2;
    const y =
      paddingTop + usableHeight - (Math.min(d.nuevos_clientes || 0, yMax) / yMax) * usableHeight;
    return { x, y, d };
  });

  const barWidth = Math.max(12, Math.min(32, usableWidth / (items.length * 1.5)));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header del gráfico */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Clientes Registrados
        </h3>

        {/* Selector de periodo tipo pills como en el mockup */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1 rounded-lg transition ${
              period === "7d"
                ? "bg-[#132A38] text-teal-300 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            7 días
          </button>
          <button
            type="button"
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1 rounded-lg transition ${
              period === "30d"
                ? "bg-[#132A38] text-teal-300 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            30 días
          </button>
          <button
            type="button"
            onClick={() => setPeriod("90d")}
            className={`px-3 py-1 rounded-lg transition ${
              period === "90d"
                ? "bg-[#132A38] text-teal-300 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            90 días
          </button>
        </div>
      </div>

      {/* Canvas SVG */}
      <div className="relative w-full overflow-hidden mt-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 overflow-visible"
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="1" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="1" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de guía y etiquetas Y */}
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
            const val = Math.round(ratio * yMax);
            const y =
              paddingTop + usableHeight - (val / yMax) * usableHeight;
            return (
              <g key={val + Math.random()}>
                <text
                  x={paddingLeft - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 select-none font-sans"
                >
                  {val}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  className="dark:stroke-slate-800"
                  strokeDasharray={val === 0 ? "" : "3 3"}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Barras del gráfico */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Eje X Etiquetas de fecha */}
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[10px] select-none font-medium ${
                    isHovered
                      ? "fill-teal-700 dark:fill-teal-400 font-bold"
                      : "fill-slate-400"
                  }`}
                >
                  {{ Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom' }[p.d.dia_nombre as string] || p.d.dia_nombre || p.d.fecha.slice(5)}
                </text>

                {/* Zona de interacción invisible (Hitbox) para capturar el hover fácilmente incluso si el valor es 0 */}
                <rect
                  x={p.x - barWidth}
                  y={paddingTop}
                  width={barWidth * 2}
                  height={height - paddingBottom - paddingTop}
                  fill="transparent"
                />

                {/* Barra de datos */}
                <rect
                  x={p.x - barWidth / 2}
                  y={p.y}
                  width={barWidth}
                  height={Math.max(0, height - paddingBottom - p.y)}
                  rx={4}
                  fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                  className="transition-all duration-300"
                />

                {/* Valor numérico encima de la barra si no es 0 o si está en hover */}
                {(isHovered || (p.d.nuevos_clientes || 0) > 0) && (
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${
                      isHovered ? "fill-teal-500" : "fill-slate-600 dark:fill-slate-300"
                    }`}
                  >
                    {p.d.nuevos_clientes || 0}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredIndex !== null && points[hoveredIndex] && (
          <div className="absolute top-2 right-4 bg-[#0B1522] text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 pointer-events-none">
            <span className="text-teal-400 font-bold">
              {{ Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles', Thu: 'Jueves', Fri: 'Viernes', Sat: 'Sábado', Sun: 'Domingo' }[points[hoveredIndex].d.dia_nombre as string] || points[hoveredIndex].d.dia_nombre || points[hoveredIndex].d.fecha}
            </span>
            <span>
              <strong>{points[hoveredIndex].d.nuevos_clientes || 0}</strong> clientes registrados
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
