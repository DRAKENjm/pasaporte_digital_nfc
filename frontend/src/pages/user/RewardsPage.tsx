import React, { useEffect, useState } from "react";
import { Gift, MapPin } from "lucide-react";
import api from "../../services/api";
import { Recompensa } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";

export const RewardsPage: React.FC = () => {
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const { showToast } = useUI();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/rewards");
        const list = data?.data ?? data ?? [];
        setRecompensas(Array.isArray(list) ? list : []);
      } catch {
        showToast("No se pudo cargar el catálogo", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const canjear = async (id: string) => {
    setCanjeando(id);
    try {
      await api.post("/rewards/canjear", { recompensa_id: id });
      showToast("¡Canje exitoso!", "success");
      await refreshProfile();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al canjear", "error");
    } finally {
      setCanjeando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  const puntos = user?.puntos_globales ?? 0;

  return (
    <div className="space-y-4 max-w-lg mx-auto animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Recompensas</h1>
          <p className="text-xs text-muted">Canjea tus puntos acumulados</p>
        </div>
        <span className="text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full tabular-nums">
          {puntos} pts
        </span>
      </div>

      {recompensas.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Sin recompensas activas"
          description="Sigue visitando locales para acumular puntos."
        />
      ) : (
        <div className="space-y-3">
          {recompensas.map((r) => {
            const canAfford = puntos >= (r.costo_puntos_globales ?? 0);
            const recojo =
              r.tipo_entrega === "LOCAL_ALIADO"
                ? r.direccion_recojo || "En el local aliado"
                : r.tipo_entrega === "VIRTUAL"
                  ? "Entrega virtual"
                  : r.direccion_recojo || "Oficina central";

            return (
              <div key={r.id} className="card flex gap-3 items-stretch !p-3.5">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {r.imagen_url ? (
                    <img
                      src={r.imagen_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Gift className="w-7 h-7 text-violet-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-semibold text-sm truncate">
                    {r.nombre_recompensa}
                  </h3>
                  {r.descripcion && (
                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5">
                      {r.descripcion}
                    </p>
                  )}
                  <p className="text-sm text-sky-600 dark:text-sky-400 mt-1 font-bold tabular-nums">
                    {r.costo_puntos_globales} pts
                  </p>
                  <p className="text-[10px] text-muted flex items-center gap-1 mt-auto pt-1">
                    <MapPin className="w-3 h-3" />
                    {recojo}
                  </p>
                </div>
                <div className="flex flex-col justify-center">
                  <Button
                    size="sm"
                    onClick={() => canjear(r.id)}
                    loading={canjeando === r.id}
                    disabled={!canAfford}
                  >
                    Canjear
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
