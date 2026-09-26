import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  type?: "curve" | "bars-green" | "bars-amber" | "bars-purple";
  badgeText?: string;
  colorScheme?: "teal" | "indigo" | "amber" | "emerald" | "purple" | "rose";
}

const colorMap = {
  teal: {
    bgIcon: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200/70 dark:border-teal-500/30",
    badge: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 border-teal-200/60 dark:border-teal-500/30",
    hoverBorder: "hover:border-teal-500/50",
  },
  emerald: {
    bgIcon: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-500/30",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/50",
  },
  amber: {
    bgIcon: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-500/30",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/30",
    hoverBorder: "hover:border-amber-500/50",
  },
  indigo: {
    bgIcon: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-500/30",
    badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-500/30",
    hoverBorder: "hover:border-indigo-500/50",
  },
  purple: {
    bgIcon: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/70 dark:border-purple-500/30",
    badge: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border-purple-200/60 dark:border-purple-500/30",
    hoverBorder: "hover:border-purple-500/50",
  },
  rose: {
    bgIcon: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-500/30",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200/60 dark:border-rose-500/30",
    hoverBorder: "hover:border-rose-500/50",
  },
};

export const AdminKpiCard: React.FC<Props> = ({
  title,
  value,
  icon: Icon,
  to,
  type = "curve",
  badgeText = "Activo",
  colorScheme = "teal",
}) => {
  const scheme = colorMap[colorScheme] || colorMap.teal;

  return (
    <Link
      to={to}
      className={`group bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-lg ${scheme.hoverBorder} transition-all duration-200 relative overflow-hidden flex flex-col justify-between`}
    >
      {/* Barra o línea de acento superior sutil */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent group-hover:via-teal-500 transition-all" />

      {/* Fila superior: Ícono con fondo reforzado + Badge descriptivo + Botón flecha */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105 ${scheme.bgIcon}`}
          >
            <Icon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${scheme.badge}`}
            >
              {badgeText}
            </span>
          )}
          <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Fila inferior: Métrica destacada y gráfico de barras/sparkline */}
      <div className="flex items-baseline justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums font-mono drop-shadow-2xs">
            {typeof value === "number" ? value.toLocaleString("es-PE") : value}
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            Total registrado
          </span>
        </div>

        {/* Sparkline / Mini gráfica visual a la derecha */}
        <div className="w-20 h-9 flex items-end justify-end shrink-0 pointer-events-none pr-1">
          {type === "curve" && (
            <svg viewBox="0 0 80 32" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={`kpiGrad-${colorScheme}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 24 Q 20 28 35 15 T 65 8 T 80 12 L 80 32 L 0 32 Z"
                fill={`url(#kpiGrad-${colorScheme})`}
              />
              <path
                d="M 0 24 Q 20 28 35 15 T 65 8 T 80 12"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}

          {type === "bars-green" && (
            <div className="flex items-end gap-1.5 h-8">
              <span className="w-2 h-2.5 rounded-t bg-emerald-500/40"></span>
              <span className="w-2 h-4 rounded-t bg-emerald-500/60"></span>
              <span className="w-2 h-6 rounded-t bg-emerald-500/80"></span>
              <span className="w-2 h-5 rounded-t bg-emerald-500/70"></span>
              <span className="w-2 h-8 rounded-t bg-emerald-600 font-bold shadow-2xs"></span>
              <span className="w-2 h-7 rounded-t bg-emerald-500"></span>
            </div>
          )}

          {type === "bars-amber" && (
            <div className="flex items-end gap-1.5 h-8">
              <span className="w-2 h-3.5 rounded-t bg-amber-500/40"></span>
              <span className="w-2 h-5 rounded-t bg-amber-500/60"></span>
              <span className="w-2 h-3 rounded-t bg-amber-500/50"></span>
              <span className="w-2 h-7 rounded-t bg-amber-500/80"></span>
              <span className="w-2 h-8 rounded-t bg-amber-600 shadow-2xs"></span>
              <span className="w-2 h-6 rounded-t bg-amber-500"></span>
            </div>
          )}

          {type === "bars-purple" && (
            <div className="flex items-end gap-1.5 h-8">
              <span className="w-2 h-2.5 rounded-t bg-purple-500/40"></span>
              <span className="w-2 h-5 rounded-t bg-purple-500/60"></span>
              <span className="w-2 h-6.5 rounded-t bg-purple-500/80"></span>
              <span className="w-2 h-4 rounded-t bg-purple-500/50"></span>
              <span className="w-2 h-8 rounded-t bg-purple-600 shadow-2xs"></span>
              <span className="w-2 h-7 rounded-t bg-purple-500"></span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
