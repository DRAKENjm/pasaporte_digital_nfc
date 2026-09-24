import React from "react";
import { Sparkles, Crown } from "lucide-react";
import { User } from "../../types";
import { getNivelInfo, initials } from "../../utils/levels";

interface Props {
  user?: User | null;
  puntosMes?: number;
}

export const RankCard: React.FC<Props> = ({ user, puntosMes = 0 }) => {
  const info = getNivelInfo(user);

  return (
    <div className="card-dark-rank text-white shadow-glow animate-scaleIn">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="absolute right-4 top-4 text-sky-400/40">
        <Sparkles className="w-6 h-6" />
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/70 font-medium">
        Tu rango actual
      </p>

      <div className="mt-2 flex items-center gap-3">
        {user?.avatarUrl || user?.avatar_url ? (
          <img
            src={user.avatarUrl || user.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-sky-400/50 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-sky-400/20 flex items-center justify-center text-sky-200 text-sm font-bold shrink-0">
            {initials(user)}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-300" />
          <h2 className="text-lg font-bold">Nivel {info.actual}</h2>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight">
            {info.puntos.toLocaleString("es-PE")}
          </p>
          <p className="text-sm text-sky-100/70 mt-0.5">puntos acumulados</p>
        </div>
        {puntosMes > 0 && (
          <span className="text-xs font-semibold text-emerald-300 bg-emerald-400/15 border border-emerald-400/25 px-2.5 py-1 rounded-full">
            +{puntosMes} este mes
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-[11px] text-sky-100/60 mb-1.5">
          <span>Progreso al siguiente nivel</span>
          <span className="font-semibold text-sky-200">{info.progreso}%</span>
        </div>
        <div className="rank-progress">
          <span style={{ width: `${info.progreso}%` }} />
        </div>
        <p className="text-[11px] text-sky-100/50 mt-2">
          {info.siguiente
            ? `Faltan ${info.faltan} sellos para ${info.siguiente}`
            : "¡Nivel máximo alcanzado!"}
        </p>
      </div>
    </div>
  );
};
