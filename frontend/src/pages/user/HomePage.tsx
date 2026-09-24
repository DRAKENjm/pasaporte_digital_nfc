import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { nfcService } from "../../services/nfcService";
import { VisitaHistorial, Logro } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { RankCard } from "../../components/home/RankCard";
import { VisitBanner } from "../../components/home/VisitBanner";
import { LogrosSection } from "../../components/home/LogrosSection";
import { getNivelInfo } from "../../utils/levels";

function buildLogros(sellos: number): Logro[] {
  return [
    {
      id: "1",
      nombre: "Pionero",
      completado: sellos >= 1,
      icono: "🚀",
      sellos_requeridos: 1,
    },
    {
      id: "2",
      nombre: "Explorador",
      completado: sellos >= 5,
      icono: "🧭",
      sellos_requeridos: 5,
    },
    {
      id: "3",
      nombre: "Viajero",
      completado: sellos >= 20,
      icono: "✈️",
      sellos_requeridos: 20,
    },
  ];
}

export const HomePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { lastVisitBanner, hideVisitBanner } = useUI();
  const [historial, setHistorial] = useState<VisitaHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
        const data = await nfcService.historial();
        setHistorial(Array.isArray(data) ? data : []);
      } catch {
        /* silencioso */
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const puntosMes = useMemo(() => {
    const now = new Date();
    return historial
      .filter((v) => {
        const d = new Date(v.fecha_hora);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, v) => acc + (v.puntos_ganados || 0), 0);
  }, [historial]);

  const logros = buildLogros(user?.total_sellos ?? 0);
  const info = getNivelInfo(user);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto animate-fadeIn pb-2">
      <RankCard user={user} puntosMes={puntosMes} />

      {lastVisitBanner?.visible && (
        <div onClick={hideVisitBanner}>
          <VisitBanner puntos={lastVisitBanner.puntos} />
        </div>
      )}

      {/* Resumen rápido sellos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card !py-3.5">
          <p className="text-[11px] text-muted uppercase tracking-wide">
            Sellos
          </p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">
            {info.sellos}
          </p>
        </div>
        <div className="card !py-3.5">
          <p className="text-[11px] text-muted uppercase tracking-wide">
            Nivel
          </p>
          <p className="text-2xl font-bold mt-0.5">{info.actual}</p>
        </div>
      </div>

      <LogrosSection logros={logros} />

      {/* Últimas visitas compactas */}
      {historial.length > 0 && (
        <section>
          <h3 className="font-bold text-base mb-3">Actividad reciente</h3>
          <ul className="space-y-2">
            {historial.slice(0, 4).map((v) => (
              <li
                key={v.id}
                className="card !py-3 flex justify-between items-center gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {v.establecimiento_nombre || v.comercio || "Local"}
                  </p>
                  <p className="text-[11px] text-muted">
                    {new Date(v.fecha_hora).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-emerald-500 font-semibold text-sm tabular-nums shrink-0">
                  +{v.puntos_ganados}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
