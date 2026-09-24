import React from "react";
import { Lock } from "lucide-react";
import { Logro } from "../../types";

interface Props {
  logros: Logro[];
  onVerTodos?: () => void;
}

export const LogrosSection: React.FC<Props> = ({ logros, onVerTodos }) => (
  <section>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="font-bold text-base">Tus logros</h3>
        <p className="text-xs text-muted">Colecciona sellos en tus visitas</p>
      </div>
      {onVerTodos && (
        <button
          type="button"
          onClick={onVerTodos}
          className="text-xs font-semibold text-sky-500 hover:text-sky-400"
        >
          Ver todos
        </button>
      )}
    </div>

    <div className="grid grid-cols-3 gap-2.5">
      {logros.map((l) => (
        <div
          key={l.id}
          className={`card !p-3 flex flex-col items-center text-center gap-1.5 min-h-[96px] justify-center
            ${l.completado ? "" : "opacity-55"}`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg
              ${
                l.completado
                  ? "bg-sky-500/15 border border-sky-500/25"
                  : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
              }`}
          >
            {l.completado ? (
              <span aria-hidden>{l.icono || "🏅"}</span>
            ) : (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <p className="text-[11px] font-semibold leading-tight">{l.nombre}</p>
          <p className="text-[10px] text-muted">
            {l.completado ? "Completado" : "Bloqueado"}
          </p>
        </div>
      ))}
    </div>
  </section>
);
