import React, { useEffect, useState } from "react";
import { Nfc, History } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { nfcService } from "../../services/nfcService";
import { VisitaHistorial } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { PassportCard } from "../../components/common/PassportCard";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";

export const WalletPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useUI();
  const [historial, setHistorial] = useState<VisitaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
        const data = await nfcService.historial();
        setHistorial(Array.isArray(data) ? data : []);
      } catch {
        // silencioso en carga inicial
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const vincularTarjeta = async () => {
    if (!uid.trim()) {
      showToast("Ingresa el UID de la tarjeta", "info");
      return;
    }
    setLinking(true);
    try {
      await nfcService.asignarTarjeta(uid.trim());
      showToast("Tarjeta NFC vinculada", "success");
      setUid("");
      await refreshProfile();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al vincular", "error");
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto animate-fadeIn">
      <PassportCard user={user} />

      {/* Vincular NFC */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <Nfc className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Vincular tarjeta NFC</h2>
            <p className="text-[11px] text-slate-500">
              UID del chip NTAG o código de registro
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="input-base flex-1 min-h-[44px]"
            placeholder="Ej. 04:A1:B2:C3:D4"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            autoCapitalize="characters"
            autoCorrect="off"
          />
          <Button
            onClick={vincularTarjeta}
            loading={linking}
            className="shrink-0"
          >
            Vincular
          </Button>
        </div>
      </section>

      {/* Historial */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-sm">Últimas visitas</h2>
        </div>

        {historial.length === 0 ? (
          <EmptyState
            icon={History}
            title="Sin sellos todavía"
            description="Visita un local aliado y valida tu pasaporte para empezar a acumular puntos."
          />
        ) : (
          <ul className="space-y-2">
            {historial.map((v) => (
              <li
                key={v.id}
                className="card flex justify-between items-center gap-3 !py-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {v.establecimiento_nombre ||
                      v.comercio ||
                      "Establecimiento"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(v.fecha_hora).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {v.metodo_validacion ? ` · ${v.metodo_validacion}` : ""}
                  </div>
                </div>
                <div className="text-emerald-400 font-semibold text-sm tabular-nums shrink-0">
                  +{v.puntos_ganados} pts
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
