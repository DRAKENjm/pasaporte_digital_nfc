import React, { useEffect, useState } from "react";
import { Gift, MapPin, Award, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";

export const RewardsPage: React.FC = () => {
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const [puntosActuales, setPuntosActuales] = useState<number>(0);
  const { user, refreshProfile } = useAuth();
  const { showToast } = useUI();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rewRes, profRes] = await Promise.all([
          api.get("/rewards"),
          api.get("/auth/profile")
        ]);
        const list = rewRes.data?.data ?? rewRes.data ?? [];
        setRecompensas(Array.isArray(list) ? list : []);
        setPuntosActuales(profRes.data?.data?.puntos_actuales ?? user?.puntos_globales ?? 0);
      } catch {
        showToast("No se pudo cargar el catálogo de recompensas", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast, user]);

  const canjear = async (id: string, ptsReq: number) => {
    if (puntosActuales < ptsReq) {
      showToast("No tienes suficientes puntos para esta recompensa", "error");
      return;
    }
    setCanjeando(id);
    try {
      await api.post("/rewards/canjear", { id_recompensa: id });
      showToast("Su solicitud de canje ha sido registrada. Esté al pendiente de la confirmación en el establecimiento.", "success");
      setPuntosActuales((prev) => Math.max(0, prev - ptsReq));
      await refreshProfile();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al solicitar el canje", "error");
    } finally {
      setCanjeando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] p-5 pb-24 flex flex-col max-w-md mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pt-2">
        <div className="flex items-center space-x-3">
          <Link
            to="/user/perfil"
            className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#2D1A1E]">Recompensas</h1>
            <p className="text-xs text-[#8E7D7D]">Canjea tus puntos por premios</p>
          </div>
        </div>

        <div className="bg-[#7C0A1E]/10 border border-[#7C0A1E]/20 px-3 py-1.5 rounded-2xl flex items-center space-x-1.5">
          <Award size={16} className="text-[#7C0A1E]" />
          <span className="text-xs font-black text-[#7C0A1E]">{puntosActuales} pts</span>
        </div>
      </div>

      {/* Lista de Recompensas */}
      {recompensas.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center my-auto">
          <Gift className="w-12 h-12 text-[#C5A059] mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#2D1A1E]">Sin recompensas disponibles</h3>
          <p className="text-xs text-[#8E7D7D] mt-1">
            Visita nuestros locales asociados para acumular sellos y desbloquear premios exclusivos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recompensas.map((r: any) => {
            const ptsReq = Number(r.puntos_requeridos || r.costo_puntos_globales || 50);
            const canAfford = puntosActuales >= ptsReq;
            const nombre = r.nombre || r.nombre_recompensa || "Recompensa Exclusiva";
            const estNombre = r.establecimiento_nombre || "Aroma Café";

            return (
              <div
                key={r.id_recompensa || r.id}
                className="bg-white rounded-3xl p-4 border border-[#EFE7DE] shadow-sm flex flex-col justify-between"
              >
                <div className="flex space-x-3.5 items-start">
                  <img
                    src={
                      r.imagen ||
                      r.imagen_url ||
                      "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=150"
                    }
                    alt={nombre}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-[#EFE7DE]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider block">
                      {estNombre}
                    </span>
                    <h3 className="font-bold text-sm text-[#2D1A1E] leading-snug mt-0.5">{nombre}</h3>
                    <p className="text-[11px] text-[#8E7D7D] line-clamp-2 mt-1">
                      {r.descripcion || "Canjeable presentando tu pasaporte digital en el local."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EFE7DE]">
                  <div>
                    <span className="text-[10px] text-[#8E7D7D] block">Costo en puntos:</span>
                    <span className="text-base font-black text-[#7C0A1E]">{ptsReq} pts</span>
                  </div>

                  <button
                    onClick={() => canjear(r.id_recompensa || r.id, ptsReq)}
                    disabled={!canAfford || canjeando === (r.id_recompensa || r.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      canAfford
                        ? "bg-[#7C0A1E] text-white hover:bg-[#600616]"
                        : "bg-[#FAF8F5] border border-[#EFE7DE] text-[#8E7D7D] cursor-not-allowed opacity-60"
                    }`}
                  >
                    {canjeando === (r.id_recompensa || r.id)
                      ? "Canjeando..."
                      : canAfford
                      ? "Canjear ahora"
                      : "Puntos insuficientes"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
