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
  Share2,
  Copy,
  Gift,
  QrCode as QrIcon,
  MessageCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
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
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "invitar" ? "invitar" : "amigos";

  const [tab, setTab] = useState<"amigos" | "solicitudes" | "agregar" | "invitar">(initialTab);
  
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

  // Invitar amigos / Referidos
  const [inviteData, setInviteData] = useState<{ codigo: string; link: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const fetchAmigos = async () => {
    try {
      const res = await api.get("/friends");
      const data = res.data?.data;
      setAmigos(data?.amigos || []);
      setTotalAmigos(data?.total || 0);
      setLimiteMaximo(data?.limite_maximo || 50);
    } catch {
      /* opcional */
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await api.get("/friends/solicitudes");
      const list = res.data?.data ?? res.data ?? [];
      setSolicitudes(Array.isArray(list) ? list : []);
    } catch {
      /* opcional */
    }
  };

  const fetchInvitacion = async () => {
    setLoadingInvite(true);
    try {
      const res = await api.post("/friends/invite");
      const d = res.data?.data || res.data;
      if (d?.codigo) {
        const cleanLink = `${window.location.origin}/auth/register?ref=${d.codigo}`;
        setInviteData({ codigo: d.codigo, link: cleanLink });
        const qr = await QRCode.toDataURL(cleanLink, {
          width: 280,
          margin: 2,
          color: { dark: "#7C0A1E", light: "#FAF8F5" },
        });
        setQrDataUrl(qr);
      }
    } catch {
      showToast("No se pudo generar el código de invitación", "error");
    } finally {
      setLoadingInvite(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAmigos(), fetchSolicitudes()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchInvitacion();
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
      const res = await api.get(`/social/usuarios?q=${encodeURIComponent(busquedaQuery.trim())}`);
      const list = res.data?.data ?? res.data ?? [];
      setUsuariosEncontrados(Array.isArray(list) ? list : []);
    } catch {
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

  const handleCopiarLink = async () => {
    if (!inviteData?.link) return;
    try {
      await navigator.clipboard.writeText(inviteData.link);
      setCopiado(true);
      showToast("¡Enlace de invitación copiado!", "success");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      showToast("Error al copiar enlace", "error");
    }
  };

  const handleCompartirWhatsApp = () => {
    if (!inviteData) return;
    const msg = `¡Hola! Únete a Pasaporte Digital para coleccionar sellos oficiales, ganar puntos y canjear recompensas en tus locales favoritos. Regístrate aquí con mi invitación: ${inviteData.link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 animate-fadeIn pb-16">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFE7DE] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/user/home"
            className="w-10 h-10 rounded-xl border border-[#EFE7DE] flex items-center justify-center hover:bg-[#FAF8F5] transition text-[#2D1A1E] shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[#2D1A1E] truncate">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C0A1E] shrink-0" />
              <span>Amigos e Invitaciones</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-[#8E7D7D] line-clamp-1 sm:line-clamp-none">
              Conecta con amigos y gana recompensas invitando viajeros
            </p>
          </div>
        </div>

        {/* Contador / Límite Badge */}
        <div className="flex items-center justify-end sm:self-center">
          <span className="text-[11px] sm:text-xs font-bold text-[#7C0A1E] bg-[#7C0A1E]/10 border border-[#7C0A1E]/20 px-3 py-1 rounded-full whitespace-nowrap">
            {totalAmigos} / {limiteMaximo} Amigos
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EFE7DE] gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setTab("amigos")}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            tab === "amigos"
              ? "border-[#7C0A1E] text-[#7C0A1E]"
              : "border-transparent text-[#8E7D7D] hover:text-[#2D1A1E]"
          }`}
        >
          Mis Amigos ({totalAmigos})
        </button>
        <button
          type="button"
          onClick={() => setTab("invitar")}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            tab === "invitar"
              ? "border-[#7C0A1E] text-[#7C0A1E]"
              : "border-transparent text-[#8E7D7D] hover:text-[#2D1A1E]"
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Invitar Amigos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">+50 pts</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("solicitudes")}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition whitespace-nowrap relative ${
            tab === "solicitudes"
              ? "border-[#7C0A1E] text-[#7C0A1E]"
              : "border-transparent text-[#8E7D7D] hover:text-[#2D1A1E]"
          }`}
        >
          Solicitudes
          {solicitudes.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black">
              {solicitudes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("agregar")}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            tab === "agregar"
              ? "border-[#7C0A1E] text-[#7C0A1E]"
              : "border-transparent text-[#8E7D7D] hover:text-[#2D1A1E]"
          }`}
        >
          + Buscar Amigo
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {/* TAB 1: LISTADO DE AMIGOS */}
          {tab === "amigos" && (
            <div className="space-y-4">
              {amigos.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#EFE7DE] rounded-2xl p-6 bg-white">
                  <Users className="w-12 h-12 text-[#8E7D7D] mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-[#2D1A1E]">Aún no tienes amigos en tu pasaporte</p>
                  <p className="text-xs text-[#8E7D7D] mt-1 max-w-sm mx-auto">
                    Invita a tus amigos o búscalos en la plataforma para ver sus aventuras y sellos.
                  </p>
                  <button
                    onClick={() => setTab("invitar")}
                    className="mt-4 px-4 py-2 bg-[#7C0A1E] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#650818] transition inline-flex items-center gap-1.5"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Invitar a mis amigos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {amigos.map((a) => (
                    <div
                      key={a.amistad_id}
                      className="p-3.5 rounded-2xl border border-[#EFE7DE] bg-white flex items-center justify-between shadow-2xs hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3">
                        {a.avatar_url ? (
                          <img
                            src={a.avatar_url}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-[#EFE7DE]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-rose-50 text-[#7C0A1E] font-bold flex items-center justify-center text-xs border border-[#7C0A1E]/20">
                            {initials({ nombres: a.nombres, apellidos: a.apellidos })}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xs text-[#2D1A1E]">
                            {a.nombres} {a.apellidos}
                          </p>
                          <p className="text-[11px] text-[#8E7D7D]">@{a.username || "viajero"}</p>
                          {a.nivel && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 inline-block"
                              style={{
                                color: a.nivel_color || "#7C0A1E",
                                backgroundColor: `${a.nivel_color || "#7C0A1E"}15`,
                              }}
                            >
                              {a.nivel}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminarAmigo(a.amigo_id)}
                        className="p-2 text-[#8E7D7D] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar de mi lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVITAR AMIGOS (REFERIDOS Y PRUEBAS) */}
          {tab === "invitar" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Banner Recompensa */}
              <div className="bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] text-white p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 bg-[#C5A059] text-[#2D1A1E] font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ★ Programa de Invitaciones
                  </span>
                  <h3 className="text-lg font-black mt-1">¡Invita amigos y gana +50 Puntos!</h3>
                  <p className="text-xs text-rose-100 leading-relaxed max-w-md">
                    Comparte tu enlace o código único. Cada amigo que se registre con tu invitación recibirá un bono de bienvenida y tú ganarás puntos para canjear recompensas exclusivas.
                  </p>
                </div>
                <Sparkles className="absolute right-4 bottom-4 w-20 h-20 text-white/10 pointer-events-none" />
              </div>

              {/* Tarjeta de Código y QR */}
              <div className="bg-white rounded-3xl border border-[#EFE7DE] p-5 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* QR Code */}
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EFE7DE] flex flex-col items-center shrink-0">
                    {loadingInvite ? (
                      <div className="w-[140px] h-[140px] flex items-center justify-center">
                        <Spinner size={24} />
                      </div>
                    ) : qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Invitación" className="w-[140px] h-[140px] rounded-xl object-contain" />
                    ) : (
                      <div className="w-[140px] h-[140px] flex items-center justify-center text-xs text-[#8E7D7D]">
                        <QrIcon className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-[#8E7D7D] mt-1.5 flex items-center gap-1">
                      <QrIcon className="w-3 h-3" /> Escanea para registrarte
                    </span>
                  </div>

                  {/* Código e Info */}
                  <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8E7D7D] tracking-wider block">
                        Tu Código de Invitación
                      </span>
                      <p className="text-2xl font-mono font-black text-[#7C0A1E] mt-0.5">
                        {inviteData?.codigo || "CARGANDO..."}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8E7D7D] tracking-wider block">
                        Enlace de Registro Directo
                      </span>
                      <div className="mt-1 flex items-center gap-2 bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl p-2">
                        <input
                          type="text"
                          readOnly
                          value={inviteData?.link || ""}
                          className="bg-transparent text-xs text-[#2D1A1E] font-mono flex-1 outline-hidden truncate"
                        />
                        <button
                          onClick={handleCopiarLink}
                          className="px-3 py-1.5 bg-[#7C0A1E] hover:bg-[#650818] text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                        >
                          {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiado ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón WhatsApp */}
                <button
                  onClick={handleCompartirWhatsApp}
                  disabled={!inviteData}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Compartir Invitación por WhatsApp</span>
                </button>
              </div>

              {/* Pasos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-[#EFE7DE] text-center">
                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] font-black text-xs flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-[#2D1A1E]">Envía tu enlace</h4>
                  <p className="text-[11px] text-[#8E7D7D] mt-0.5">Comparte tu link por WhatsApp o redes sociales.</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#EFE7DE] text-center">
                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] font-black text-xs flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-[#2D1A1E]">Tu amigo se registra</h4>
                  <p className="text-[11px] text-[#8E7D7D] mt-0.5">Crea su cuenta y activa su primer pasaporte.</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#EFE7DE] text-center">
                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] font-black text-xs flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-[#2D1A1E]">¡Ambos ganan!</h4>
                  <p className="text-[11px] text-[#8E7D7D] mt-0.5">Reciben puntos inmediatos para canjes y premios.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOLICITUDES PENDIENTES */}
          {tab === "solicitudes" && (
            <div className="space-y-3">
              {solicitudes.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#EFE7DE] rounded-2xl p-6 bg-white">
                  <Clock className="w-10 h-10 text-[#8E7D7D] mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-[#2D1A1E]">No tienes solicitudes pendientes</p>
                  <p className="text-xs text-[#8E7D7D] mt-1">
                    Cuando otros viajeros te envíen solicitudes de amistad, aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {solicitudes.map((s) => (
                    <div
                      key={s.solicitud_id}
                      className="p-3.5 rounded-2xl border border-[#EFE7DE] bg-white flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] font-bold flex items-center justify-center text-xs">
                          {initials({ nombres: s.nombres, apellidos: s.apellidos })}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#2D1A1E]">
                            {s.nombres} {s.apellidos}
                          </p>
                          <p className="text-[11px] text-[#8E7D7D]">@{s.username || "viajero"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResponderSolicitud(s.solicitud_id, "ACEPTAR")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResponderSolicitud(s.solicitud_id, "RECHAZAR")}
                          className="px-3 py-1.5 border border-[#EFE7DE] hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-semibold transition text-[#8E7D7D]"
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

          {/* TAB 4: AGREGAR AMIGO (BÚSQUEDA) */}
          {tab === "agregar" && (
            <div className="space-y-4">
              <form onSubmit={handleBuscarUsuarios} className="flex gap-2">
                <input
                  type="text"
                  value={busquedaQuery}
                  onChange={(e) => setBusquedaQuery(e.target.value)}
                  placeholder="Buscar por código, usuario o nombre..."
                  className="input-base flex-1"
                />
                <button
                  type="submit"
                  disabled={buscandoUsuarios}
                  className="px-5 py-2.5 bg-[#7C0A1E] hover:bg-[#650818] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition"
                >
                  <Search className="w-4 h-4" /> Buscar
                </button>
              </form>

              {usuariosEncontrados.length > 0 ? (
                <div className="divide-y divide-[#EFE7DE] border border-[#EFE7DE] rounded-2xl bg-white overflow-hidden shadow-2xs">
                  {usuariosEncontrados.map((u) => (
                    <div key={u.id_usuario || u.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-[#2D1A1E]">
                          {u.nombres} {u.apellidos}
                        </p>
                        <p className="text-[11px] text-[#8E7D7D]">@{u.username || "usuario"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEnviarSolicitud(u.id_usuario || u.id)}
                        disabled={enviando}
                        className="px-3 py-1.5 bg-[#7C0A1E] hover:bg-[#650818] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Enviar Solicitud
                      </button>
                    </div>
                  ))}
                </div>
              ) : busquedaQuery && !buscandoUsuarios ? (
                <div className="text-center py-8 text-xs text-[#8E7D7D]">
                  No se encontraron viajeros con ese término. Puedes probar compartiendo tu enlace en la pestaña "Invitar Amigos".
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};
