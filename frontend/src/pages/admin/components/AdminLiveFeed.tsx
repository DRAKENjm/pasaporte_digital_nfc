import React from "react";
import { ActividadRecienteItem } from "../../../types/admin";
import { Clock, Nfc, QrCode, Sparkles, Building2, User } from "lucide-react";

interface Props {
  actividad: ActividadRecienteItem[];
  reclamacionesPendientes: number;
  denunciasPendientes: number;
}

export const AdminLiveFeed: React.FC<Props> = ({
  actividad,
  reclamacionesPendientes,
  denunciasPendientes,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[rgb(var(--app-text))]">
              Auditoría y Validaciones en Tiempo Real
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Registro de interacciones y sellos emitidos en comercios
          </p>
        </div>

        {/* Badges de alertas operativas */}
        <div className="flex items-center gap-2">
          {reclamacionesPendientes > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              ⚠️ {reclamacionesPendientes} {reclamacionesPendientes === 1 ? "reclamo" : "reclamos"} pendiente
            </span>
          )}
          {denunciasPendientes > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              🛡️ {denunciasPendientes} denuncias
            </span>
          )}
        </div>
      </div>

      {/* Lista de actividad */}
      <div className="space-y-2">
        {actividad.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted">
            No hay actividad reciente registrada en el sistema
          </div>
        ) : (
          actividad.map((item) => {
            const isNfc = item.metodo_validacion === "NFC";
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar o ícono */}
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {item.usuario_avatar ? (
                      <img
                        src={item.usuario_avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-sky-500" />
                    )}
                  </div>

                  {/* Detalle usuario y local */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[rgb(var(--app-text))] truncate">
                        {item.usuario_nombre}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isNfc
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                            : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {isNfc ? (
                          <Nfc className="w-3 h-3" />
                        ) : (
                          <QrCode className="w-3 h-3" />
                        )}
                        {item.metodo_validacion}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted flex items-center gap-1 truncate mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.establecimiento_nombre}</span>
                    </p>
                  </div>
                </div>

                {/* Puntos y Fecha */}
                <div className="text-right shrink-0 ml-3">
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    +{item.puntos_ganados} pts
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {formatDate(item.fecha_hora)} · {formatTime(item.fecha_hora)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
