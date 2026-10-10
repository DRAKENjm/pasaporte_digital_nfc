import React, { useEffect, useState } from "react";
import { Gift, MapPin, Award, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { useLanguage } from "../../context/LanguageContext";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";

export const RewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"catalogo" | "historial">("catalogo");
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [misCanjes, setMisCanjes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCanjes, setLoadingCanjes] = useState(false);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const [puntosActuales, setPuntosActuales] = useState<number>(0);
  const [canjeExitoso, setCanjeExitoso] = useState<any | null>(null);
  const { user, refreshProfile } = useAuth();
  const { showToast } = useUI();
  const { t } = useLanguage();

  const fetchCanjes = async () => {
    setLoadingCanjes(true);
    try {
      const res = await api.get("/rewards/mis-canjes");
      const list = res.data?.data ?? res.data ?? [];
      setMisCanjes(Array.isArray(list) ? list : []);
    } catch {
      showToast("No se pudo cargar el historial de canjes", "error");
    } finally {
      setLoadingCanjes(false);
    }
  };

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
      showToast("Puntos insuficientes", "error");
      return;
    }
    setCanjeando(id);
    try {
      const res = await api.post("/rewards/canjear", { id_recompensa: id });
      const data = res.data?.data;
      setCanjeExitoso(data || { recompensa: { puntos_canjeados: ptsReq } });
      showToast("Solicitud registrada", "success");
      setPuntosActuales((prev) => Math.max(0, prev - ptsReq));
      await refreshProfile();
      fetchCanjes();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al solicitar canje", "error");
    } finally {
      setCanjeando(null);
    }
  };

  const [cancelando, setCancelando] = useState<number | null>(null);

  const cancelarCanjeCliente = async (idCanje: number) => {
    if (!window.confirm("¿Seguro que deseas cancelar este canje? Tus puntos serán devueltos a tu saldo.")) {
      return;
    }
    setCancelando(idCanje);
    try {
      await api.post("/rewards/cancelar", { id_canje: idCanje });
      showToast("Canje cancelado y puntos devueltos", "success");
      await Promise.all([
        fetchCanjes(),
        refreshProfile(),
      ]);
      const profRes = await api.get("/auth/profile");
      setPuntosActuales(profRes.data?.data?.puntos_actuales ?? user?.puntos_globales ?? 0);
      const rewRes = await api.get("/rewards");
      setRecompensas(Array.isArray(rewRes.data?.data) ? rewRes.data.data : []);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo cancelar el canje", "error");
    } finally {
      setCancelando(null);
    }
  };

  const handleTabChange = (tab: "catalogo" | "historial") => {
    setActiveTab(tab);
    if (tab === "historial" && misCanjes.length === 0) {
      fetchCanjes();
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
      <div className="flex items-center justify-between mb-4 pt-2">
        <div className="flex items-center space-x-3">
          <Link
            to="/user/perfil"
            className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#2D1A1E]">{t("rewards") || "Recompensas"}</h1>
            <p className="text-xs text-[#8E7D7D]">{t("redeemPoints") || "Canjea tus puntos por premios"}</p>
          </div>
        </div>

        <div className="bg-[#7C0A1E]/10 border border-[#7C0A1E]/20 px-3 py-1.5 rounded-2xl flex items-center space-x-1.5">
          <Award size={16} className="text-[#7C0A1E]" />
          <span className="text-xs font-black text-[#7C0A1E]">{puntosActuales} pts</span>
        </div>
      </div>

      {/* Tabs: Catálogo vs Historial de Canjes */}
      <div className="bg-white p-1 rounded-2xl border border-[#EFE7DE] flex mb-4 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange("catalogo")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "catalogo"
              ? "bg-[#7C0A1E] text-white shadow-2xs"
              : "text-[#8E7D7D] hover:text-[#2D1A1E]"
          }`}
        >
          Catálogo ({recompensas.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("historial")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "historial"
              ? "bg-[#7C0A1E] text-white shadow-2xs"
              : "text-[#8E7D7D] hover:text-[#2D1A1E]"
          }`}
        >
          Mis Canjes {misCanjes.length > 0 ? `(${misCanjes.length})` : ""}
        </button>
      </div>

      {/* Vista Catálogo */}
      {activeTab === "catalogo" && (
        <>
          {recompensas.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center my-auto">
              <Gift className="w-12 h-12 text-[#C5A059] mx-auto mb-3" />
              <h3 className="font-bold text-sm text-[#2D1A1E]">{t("noRewards") || "Sin recompensas disponibles"}</h3>
              <p className="text-xs text-[#8E7D7D] mt-1">
                Visita locales asociados para acumular puntos y canjear premios.
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
                          {r.descripcion || "Canjeable en el local con tu pasaporte."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EFE7DE]">
                      <div>
                        <span className="text-[10px] text-[#8E7D7D] block">Costo en puntos:</span>
                        <span className="text-base font-black text-[#7C0A1E]">{ptsReq} pts</span>
                      </div>

                      {r.canjeado_hoy ? (
                        <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800">
                          Canjeado hoy
                        </span>
                      ) : (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Vista Mis Canjes (Historial de Canjes) */}
      {activeTab === "historial" && (
        <div className="space-y-3">
          {loadingCanjes ? (
            <div className="py-12 flex justify-center">
              <Spinner size={28} />
            </div>
          ) : misCanjes.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center my-6">
              <Gift className="w-12 h-12 text-[#8E7D7D]/40 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-[#2D1A1E]">No tienes canjes registrados</h3>
              <p className="text-xs text-[#8E7D7D] mt-1">
                Cuando canjees un beneficio en el catálogo, podrás seguir su estado y código aquí.
              </p>
            </div>
          ) : (
            misCanjes.map((c: any) => {
              const esPendiente = c.estado === "PENDIENTE";
              const esEntregado = c.estado === "CANJEADO" || c.estado === "ENTREGADO" || c.estado === "CONFIRMADO";

              return (
                <div
                  key={c.id_canje}
                  className="bg-white rounded-2xl p-4 border border-[#EFE7DE] shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {c.recompensa_imagen ? (
                        <img
                          src={c.recompensa_imagen}
                          alt={c.recompensa_nombre}
                          className="w-12 h-12 rounded-xl object-cover border border-[#EFE7DE] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] flex items-center justify-center font-bold text-lg shrink-0">
                          <Gift size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#C5A059] uppercase block truncate">
                          {c.establecimiento_nombre}
                        </span>
                        <h4 className="text-sm font-bold text-[#2D1A1E] leading-snug truncate">
                          {c.recompensa_nombre}
                        </h4>
                        <span className="text-[11px] font-bold text-[#7C0A1E]">
                          {c.puntos_canje} pts
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                        esPendiente
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : esEntregado
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {esPendiente ? "Pendiente" : esEntregado ? "Entregado" : c.estado}
                    </span>
                  </div>

                  {/* Código de canje, fecha y botón cancelar si está pendiente */}
                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFE7DE] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] text-[#8E7D7D] uppercase font-bold block">
                        Código de Canje
                      </span>
                      <span className="font-mono font-bold text-[#7C0A1E] tracking-wider">
                        {c.codigo_canje}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8E7D7D]">
                        {c.fecha_solicitud
                          ? new Date(c.fecha_solicitud).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>

                      {esPendiente && (
                        <button
                          type="button"
                          onClick={() => cancelarCanjeCliente(c.id_canje)}
                          disabled={cancelando === c.id_canje}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {cancelando === c.id_canje ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Informativo de Canje Exitoso */}
      {canjeExitoso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-[#EFE7DE] shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Solicitud Registrada
              </span>
              <h3 className="text-xl font-bold text-[#2D1A1E] pt-1">
                ¡Recompensa Canjeada!
              </h3>
              <p className="text-xs text-[#8E7D7D] leading-relaxed">
                Muestra el código en el local para recibir tu premio.
              </p>
            </div>

            {canjeExitoso?.canje?.codigo_canje && (
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE7DE] space-y-1">
                <span className="text-[10px] font-bold text-[#8E7D7D] uppercase tracking-wider block">
                  Código de Verificación
                </span>
                <span className="text-lg font-black font-mono tracking-widest text-[#7C0A1E]">
                  {canjeExitoso.canje.codigo_canje}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setCanjeExitoso(null);
                handleTabChange("historial");
              }}
              className="w-full py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-black hover:bg-[#600616] transition-all shadow-md cursor-pointer"
            >
              VER MIS CANJES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
