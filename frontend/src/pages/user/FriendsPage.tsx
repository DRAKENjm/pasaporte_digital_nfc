import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Check,
  X,
  Trash2,
  Search,
  Shield,
  Award,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { initials } from "../../utils/levels";

interface Amigo {
  amistad_id: string;
  amigo_id: string;
  nombres: string;
  apellidos: string;
  username?: string;
  avatar_url?: string;
  nivel?: string;
  nivel_color?: string;
  amigos_desde: string;
}

interface Solicitud {
  solicitud_id: string;
  solicitante_id: string;
  nombres: string;
  apellidos: string;
  username?: string;
  avatar_url?: string;
  nivel?: string;
  nivel_color?: string;
  created_at: string;
}

export const FriendsPage: React.FC = () => {
  const { showToast } = useUI();
  const [tab, setTab] = useState<"amigos" | "solicitudes" | "agregar">("amigos");
  
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [totalAmigos, setTotalAmigos] = useState(0);
  const [limiteMaximo, setLimiteMaximo] = useState(50);
  const [loading, setLoading] = useState(true);

  // Agregar amigo
  const [busquedaQuery, setBusquedaQuery] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<any[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);

  const fetchAmigos = async () => {
    try {
      const res = await api.get("/friends");
      const data = res.data?.data;
      setAmigos(data?.amigos || []);
      setTotalAmigos(data?.total || 0);
      setLimiteMaximo(data?.limite_maximo || 50);
    } catch (err: any) {
      /* opcional */
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await api.get("/friends/solicitudes");
      const list = res.data?.data ?? res.data ?? [];
      setSolicitudes(Array.isArray(list) ? list : []);
    } catch (err: any) {
      /* opcional */
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAmigos(), fetchSolicitudes()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResponderSolicitud = async (solicitudId: string, accion: "ACEPTAR" | "RECHAZAR") => {
    try {
      await api.patch(`/friends/solicitudes/${solicitudId}/responder`, { accion });
      showToast(accion === "ACEPTAR" ? "¡Amigo agregado!" : "Solicitud rechazada", "success");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al procesar la solicitud", "error");
    }
  };

  const handleEliminarAmigo = async (amigoId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar a este amigo de tu pasaporte?")) return;
    try {
      await api.delete(`/friends/${amigoId}`);
      showToast("Amigo eliminado de tu lista", "success");
      fetchAmigos();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al eliminar", "error");
    }
  };

  const handleBuscarUsuarios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busquedaQuery.trim()) return;

    setBuscandoUsuarios(true);
    try {
      // Búsqueda de usuarios cliente para agregar
      const res = await api.get(`/social/usuarios?q=${encodeURIComponent(busquedaQuery.trim())}`);
      const list = res.data?.data ?? res.data ?? [];
      setUsuariosEncontrados(Array.isArray(list) ? list : []);
    } catch {
      // Fallback
      setUsuariosEncontrados([]);
    } finally {
      setBuscandoUsuarios(false);
    }
  };

  const handleEnviarSolicitud = async (targetId: string) => {
    setEnviando(true);
    try {
      await api.post("/friends/solicitudes", { receptor_id: targetId });
      showToast("Solicitud de amistad enviada", "success");
      setBusquedaQuery("");
      setUsuariosEncontrados([]);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo enviar la solicitud", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--app-border))] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/user/feed"
            className="w-10 h-10 rounded-xl border border-[rgb(var(--app-border))] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-muted" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-sky-600" />
              Círculo de Amigos
            </h1>
            <p className="text-xs text-muted">
              Conexiones exclusivas de viajeros en Pasaporte Digital
            </p>
          </div>
        </div>

        {/* Contador con Límite */}
        <div className="text-right">
          <span className="text-xs font-bold text-sky-600 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
            {totalAmigos} / {limiteMaximo} Amigos
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgb(var(--app-border))] gap-2">
        <button
          type="button"
          onClick={() => setTab("amigos")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
            tab === "amigos"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-muted hover:text-[rgb(var(--app-text))]"
          }`}
        >
          Mis Amigos ({totalAmigos})
        </button>
        <button
          type="button"
          onClick={() => setTab("solicitudes")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition relative ${
            tab === "solicitudes"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-muted hover:text-[rgb(var(--app-text))]"
          }`}
        >
          Solicitudes
          {solicitudes.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black">
              {solicitudes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("agregar")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
            tab === "agregar"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-muted hover:text-[rgb(var(--app-text))]"
          }`}
        >
          + Agregar Amigo
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {/* TAB 1: LISTA DE AMIGOS */}
          {tab === "amigos" && (
            <div className="space-y-3">
              {amigos.length === 0 ? (
                <div className="p-8 text-center border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))]">
                  <Users className="w-10 h-10 text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">Aún no tienes amigos agregados</p>
                  <p className="text-xs text-muted mt-1">
                    Conecta con otros viajeros para ver sus sellos y publicaciones exclusivas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("agregar")}
                    className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
                  >
                    Buscar y agregar amigos
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--app-border))] border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))] overflow-hidden">
                  {amigos.map((a) => (
                    <div key={a.amistad_id} className="p-3.5 flex items-center justify-between hover:bg-slate-500/5 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            initials({ nombres: a.nombres, apellidos: a.apellidos })
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">
                            {a.nombres} {a.apellidos}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.username && <span className="text-xs text-muted">@{a.username}</span>}
                            {a.nivel && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                                style={{ backgroundColor: `${a.nivel_color || '#CE8946'}20`, color: a.nivel_color || '#CE8946' }}
                              >
                                {a.nivel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminarAmigo(a.amigo_id)}
                        className="p-2 text-muted hover:text-rose-500 transition"
                        title="Eliminar amigo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOLICITUDES PENDIENTES */}
          {tab === "solicitudes" && (
            <div className="space-y-3">
              {solicitudes.length === 0 ? (
                <div className="p-8 text-center border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))]">
                  <Clock className="w-10 h-10 text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No tienes solicitudes pendientes</p>
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--app-border))] border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))] overflow-hidden">
                  {solicitudes.map((s) => (
                    <div key={s.solicitud_id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs">
                          {initials({ nombres: s.nombres, apellidos: s.apellidos })}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {s.nombres} {s.apellidos}
                          </p>
                          <p className="text-xs text-muted">@{s.username || "viajero"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResponderSolicitud(s.solicitud_id, "ACEPTAR")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResponderSolicitud(s.solicitud_id, "RECHAZAR")}
                          className="px-3 py-1.5 border border-[rgb(var(--app-border))] hover:bg-rose-500/10 hover:text-rose-600 rounded-lg text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGREGAR AMIGO */}
          {tab === "agregar" && (
            <div className="space-y-4">
              <form onSubmit={handleBuscarUsuarios} className="flex gap-2">
                <input
                  type="text"
                  value={busquedaQuery}
                  onChange={(e) => setBusquedaQuery(e.target.value)}
                  placeholder="Buscar por usuario o nombre..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={buscandoUsuarios}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" /> Buscar
                </button>
              </form>

              {usuariosEncontrados.length > 0 && (
                <div className="divide-y divide-[rgb(var(--app-border))] border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))] overflow-hidden">
                  {usuariosEncontrados.map((u) => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">
                          {u.nombres} {u.apellidos}
                        </p>
                        <p className="text-xs text-muted">@{u.username || "usuario"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEnviarSolicitud(u.id)}
                        disabled={enviando}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Enviar Solicitud
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
