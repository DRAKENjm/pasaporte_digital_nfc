import React from "react";
import { LevelBadge, NivelPasaporte } from "./LevelBadge";
import { User } from "../../types";

interface Props {
  user?: User | null;
  className?: string;
}

const gradientByLevel = (nivel?: string | null) => {
  const v = (nivel || "").toLowerCase();
  if (v.includes("diamante")) return "from-cyan-600 via-sky-600 to-indigo-700";
  if (v.includes("oro")) return "from-amber-500 via-orange-500 to-amber-700";
  if (v.includes("plata")) return "from-slate-400 via-slate-500 to-slate-600";
  return "from-amber-700 via-orange-800 to-stone-800"; // bronce
};

export const PassportCard: React.FC<Props> = ({ user, className = "" }) => {
  const nivel = (user?.nivel_nombre ||
    user?.nivel ||
    "Bronce") as NivelPasaporte;
  const nombre =
    [user?.nombres, user?.apellidos].filter(Boolean).join(" ") ||
    user?.fullName ||
    "Usuario";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 shadow-card text-white ${className}`}
      style={{ backgroundImage: undefined }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientByLevel(nivel)}`}
      />
      {/* decor */}
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full" />
      <div className="absolute -left-6 -bottom-10 w-28 h-28 bg-black/10 rounded-full" />
      <div
        className="absolute right-4 bottom-4 opacity-20 text-6xl select-none"
        aria-hidden
      >
        🎟️
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-white/70 text-xs font-medium tracking-wide uppercase">
              Pasaporte NFC
            </p>
            <h1 className="text-xl font-bold mt-0.5 leading-tight">{nombre}</h1>
            {user?.email && (
              <p className="text-white/60 text-xs mt-0.5 truncate max-w-[200px]">
                {user.email}
              </p>
            )}
          </div>
          <LevelBadge nivel={nivel} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
            <div className="text-2xl font-bold tabular-nums">
              {user?.total_sellos ?? 0}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">
              Sellos
            </div>
          </div>
          <div className="bg-black/20 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
            <div className="text-2xl font-bold tabular-nums">
              {user?.puntos_globales ?? 0}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">
              Puntos
            </div>
          </div>
          <div className="bg-black/20 rounded-2xl px-3 py-2.5 backdrop-blur-sm flex flex-col justify-center">
            <div className="text-sm font-semibold leading-tight">{nivel}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">
              Nivel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
