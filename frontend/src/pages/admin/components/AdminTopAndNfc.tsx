import React from "react";
import { TopEstablecimientoItem, ResumenNfc } from "../../../types/admin";
import { Building2, CreditCard, Sparkles, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  topLocales: TopEstablecimientoItem[];
  resumenNfc: ResumenNfc;
}

export const AdminTopAndNfc: React.FC<Props> = ({ topLocales, resumenNfc }) => {
  const maxSellos = Math.max(...topLocales.map((l) => l.total_sellos), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Top 5 Locales Aliados (Ocupa 2 columnas en desktop) */}
      <div className="lg:col-span-2 bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Building2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-[rgb(var(--app-text))]">
                Top Locales Aliados con Mayor Impacto
              </h3>
            </div>
            <Link
              to="/admin/locales"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              Ver todos →
            </Link>
          </div>
          <p className="text-xs text-muted">
            Establecimientos con más sellos otorgados y dinamismo de clientes
          </p>
        </div>

        <div className="my-3 space-y-3">
          {topLocales.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              Aún no hay registros de validaciones en locales
            </div>
          ) : (
            topLocales.map((local, idx) => {
              const percent = Math.round((local.total_sellos / maxSellos) * 100);
              return (
                <div
                  key={local.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? "bg-amber-400 text-slate-950 shadow-xs"
                        : idx === 1
                        ? "bg-slate-300 text-slate-900"
                        : idx === 2
                        ? "bg-amber-700/80 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-[rgb(var(--app-text))] truncate">
                        {local.nombre}
                      </p>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 shrink-0 ml-2">
                        {local.total_sellos} sellos
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-500 h-1.5 rounded-full"
                        style={{ width: `${Math.max(percent, 5)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-medium text-muted flex items-center justify-end gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {local.total_puntos.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-[rgb(var(--app-border))] text-[11px] text-muted flex items-center justify-between">
          <span>Ranking en base al volumen total</span>
          <span className="font-medium text-[rgb(var(--app-text))]">
            Actualización automática
          </span>
        </div>
      </div>

      {/* Hardware NFC Widget (1 columna) */}
      <div className="bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <CreditCard className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-[rgb(var(--app-text))]">
                Inventario Hardware NFC
              </h3>
            </div>
            <Link
              to="/admin/tarjetas"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              Gestionar →
            </Link>
          </div>
          <p className="text-xs text-muted">
            Control de tarjetas físicas NTAG213/215
          </p>
        </div>

        <div className="my-4 space-y-2.5">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-[rgb(var(--app-text))]">
                Tarjetas Asignadas
              </span>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              {resumenNfc.asignadas} activas
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-semibold text-[rgb(var(--app-text))]">
                Disponibles en Stock
              </span>
            </div>
            <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
              {resumenNfc.en_stock} listas
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-[rgb(var(--app-text))]">
                Extraviadas / Reportadas
              </span>
            </div>
            <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
              {resumenNfc.extraviadas}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-[rgb(var(--app-text))]">
                Bloqueadas / Bajas
              </span>
            </div>
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
              {resumenNfc.bloqueadas}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[rgb(var(--app-border))] text-[11px] text-muted flex items-center justify-between">
          <span>Total en registro: <strong>{resumenNfc.total}</strong></span>
          <Link
            to="/admin/tarjetas"
            className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
          >
            + Cargar Lote
          </Link>
        </div>
      </div>
    </div>
  );
};
