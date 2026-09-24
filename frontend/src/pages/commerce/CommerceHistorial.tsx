import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { History } from "lucide-react";

interface Row {
  id: string;
  puntos_ganados: number;
  metodo_validacion?: string;
  fecha_hora: string;
  cliente_nombre?: string;
  usuario_nombres?: string;
  usuario_apellidos?: string;
}

export const CommerceHistorial: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const estId = localStorage.getItem("comercio_establecimiento_id");
        const { data } = await api.get("/establishments/me/visitas", {
          params: estId ? { establecimiento_id: estId } : {},
        });
        const list = data?.data ?? data ?? [];
        setRows(Array.isArray(list) ? list : []);
      } catch {
        setError("No se pudo cargar el historial. Recarga para reintentar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <h1 className="text-xl font-bold">Historial de validaciones</h1>
      {error && (
        <p role="alert" className="text-red-500">
          {error}
        </p>
      )}
      {rows.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin registros"
          description="Cuando valides visitas aparecerán aquí."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card !py-3 flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {r.cliente_nombre ||
                    [r.usuario_nombres, r.usuario_apellidos]
                      .filter(Boolean)
                      .join(" ") ||
                    "Cliente"}
                </p>
                <p className="text-[11px] text-muted">
                  {new Date(r.fecha_hora).toLocaleString("es-PE")} ·{" "}
                  {r.metodo_validacion || "—"}
                </p>
              </div>
              <span className="text-emerald-500 font-semibold text-sm tabular-nums">
                +{r.puntos_ganados}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
