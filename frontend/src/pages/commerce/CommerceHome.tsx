import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, Users, Stamp, TrendingUp } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../hooks/useAuth";

export const CommerceHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    visitasHoy: 0,
    visitasMes: 0,
    puntosHoy: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Endpoint opcional; si no existe, valores en 0
        const { data } = await api.get("/establishments/me/stats");
        const d = data?.data ?? data;
        if (d) {
          setStats({
            visitasHoy: d.visitas_hoy ?? d.visitasHoy ?? 0,
            visitasMes: d.visitas_mes ?? d.visitasMes ?? 0,
            puntosHoy: d.puntos_hoy ?? d.puntosHoy ?? 0,
          });
        }
      } catch {
        setError(
          "No se pudieron cargar las estadísticas. Recarga para reintentar.",
        );
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
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold">Hola, {user?.nombres || "equipo"}</h1>
        <p className="text-sm text-muted mt-0.5">
          Valida visitas de clientes con NFC o UID. No ves recompensas ni
          comunidad del usuario.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-red-500">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Visitas hoy", value: stats.visitasHoy, icon: Stamp },
          { label: "Este mes", value: stats.visitasMes, icon: TrendingUp },
          { label: "Pts hoy", value: stats.puntosHoy, icon: Users },
        ].map((s) => (
          <div key={s.label} className="card !py-3 text-center">
            <s.icon className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-bold tabular-nums">{s.value}</p>
            <p className="text-[10px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <Link to="/commerce/validar">
        <Button
          fullWidth
          size="lg"
          className="!bg-amber-500 hover:!bg-amber-400"
        >
          <ScanLine className="w-5 h-5" />
          Validar visita ahora
        </Button>
      </Link>

      <div className="card space-y-2 text-sm text-muted">
        <p className="font-semibold text-[rgb(var(--app-text))]">
          Recordatorio anti-fraude
        </p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>Solo el personal del local acredita sellos.</li>
          <li>
            Acercar la tarjeta NFC no suma puntos solo: hace falta tu
            confirmación.
          </li>
          <li>Respetar el límite diario configurado por admin.</li>
        </ul>
      </div>
    </div>
  );
};
