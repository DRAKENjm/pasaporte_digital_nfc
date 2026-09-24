import React from "react";
import { Link } from "react-router-dom";
import { AdminDashboardData } from "../../../types/admin";
import {
  Wifi,
  Gift,
  ChevronRight,
  Store,
  CheckCircle,
} from "lucide-react";

interface Props {
  data: AdminDashboardData | null;
}

export const AdminBottomRow: React.FC<Props> = ({ data }) => {
  const canjesPendientes = data?.canjes_pendientes ?? 0;
  const canjesTotales = data?.canjes_totales ?? 0;
  const canjesEntregados = Math.max(0, canjesTotales - canjesPendientes);

  const topLocales = data?.top_establecimientos || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Estado de la Red NFC */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Estado de la Red NFC
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Tiempo real
          </span>
        </div>

        <div className="flex items-center gap-4 my-auto">
          {/* Gráfico circular / icono de onda NFC */}
          <div className="relative w-18 h-18 rounded-full border-4 border-teal-600/20 flex items-center justify-center shrink-0">
            <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Wifi className="w-6 h-6 rotate-90" />
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-400 block">
              Red operativa
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white block mt-0.5">
              En línea
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              Todos los servicios funcionando correctamente.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Recompensas y Canjes */}
      <Link
        to="/admin/recompensas"
        className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-teal-500/40 transition"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recompensas y Canjes
          </h3>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
        </div>

        <div className="flex items-center gap-4 my-auto">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-amber-600 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight block">
              {canjesPendientes}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Pendientes de entrega
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-base font-black text-slate-900 dark:text-white block">
              {canjesEntregados}
            </span>
            <span className="text-[11px] text-slate-400">Entregadas</span>
          </div>
          <div>
            <span className="text-base font-black text-slate-900 dark:text-white block">
              {canjesPendientes}
            </span>
            <span className="text-[11px] text-slate-400">En preparación</span>
          </div>
        </div>
      </Link>

      {/* 3. Locales con más actividad */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Locales con más actividad
          </h3>
          <Link
            to="/admin/locales"
            className="text-xs font-semibold text-slate-500 hover:text-teal-600 flex items-center gap-0.5"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2 my-auto">
          {topLocales.slice(0, 5).map((local, idx) => (
            <div
              key={local.id || idx}
              className="flex items-center justify-between text-xs py-1"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-4 text-[11px] font-bold text-slate-400 shrink-0 text-center">
                  {idx + 1}
                </span>
                <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {local.nombre}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                {local.total_sellos ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
