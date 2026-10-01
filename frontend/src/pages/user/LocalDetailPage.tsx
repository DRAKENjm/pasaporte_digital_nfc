import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Heart,
  MessageCircle,
  Instagram,
  Facebook,
  Gift,
  Stamp,
  Sparkles,
  Camera,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { DigitalStampBadge, resolveImageUrl } from "../../components/common/DigitalStampBadge";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { nfcService } from "../../services/nfcService";

/** Icono simple para X (Twitter) */
const XIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LocalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [local, setLocal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [esFavorito, setEsFavorito] = useState(false);

  // Estados de Auto-sellado
  const [sellando, setSellando] = useState(false);
  const [mostrarModalAutosello, setMostrarModalAutosello] = useState(false);
  const [selloExitoso, setSelloExitoso] = useState<any | null>(null);
  const [fotoEvidencia, setFotoEvidencia] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [distanciaDetectada, setDistanciaDetectada] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/establishments/${id}`);
        setLocal(data?.data ?? data);
      } catch {
        try {
          const { data } = await api.get("/establishments");
          const list = data?.data ?? [];
          const found = Array.isArray(list)
            ? list.find((x: any) => String(x.id_establecimiento) === String(id) || String(x.id) === String(id))
            : null;
          setLocal(found || null);
        } catch {
          showToast("No se pudo cargar el local", "error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, showToast]);

  const toggleFav = async () => {
    if (!id) return;
    try {
      const res = await api.post(`/establishments/${id}/favorito`);
      setEsFavorito(!!res.data?.data?.favorito);
      showToast(res.data?.data?.favorito ? "Añadido a favoritos" : "Quitado de favoritos", "success");
    } catch {
      showToast("No se pudo actualizar favorito", "info");
    }
  };

  const sucursal = local?.sucursales?.[0] || local;
  const lat = sucursal?.latitud ?? local?.lat;
  const lng = sucursal?.longitud ?? local?.lng;
  const direccion = sucursal?.direccion || local?.direccion || "";
  const horario =
    local?.horario_atencion || sucursal?.horario || "Horario no disponible";

  const permiteAutosellado = !!sucursal?.permite_autosellado;
  const radioTolerancia = sucursal?.radio_tolerancia_metros || 150;
  const requiereFoto = !!sucursal?.requiere_foto;

  const handleSubirFoto = async (file: File) => {
    setSubiendoFoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", "autosellado");
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setFotoEvidencia(url);
        showToast("Foto comprobatoria cargada", "success");
      }
    } catch {
      showToast("Error al subir foto de comprobación", "error");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const ejecutarAutosellado = () => {
    if (!navigator.geolocation) {
      showToast("Tu navegador no soporta geolocalización GPS", "error");
      return;
    }

    if (requiereFoto && !fotoEvidencia) {
      showToast("Este lugar requiere subir una foto comprobatoria para auto-sellar", "error");
      return;
    }

    setSellando(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await nfcService.autosellar({
            id_sucursal: sucursal?.id_sucursal,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            foto_evidencia: fotoEvidencia || undefined,
            id_programa: local?.id_programa || undefined,
          });

          setSelloExitoso(res.data);
          setDistanciaDetectada(res.data?.visita?.distancia_metros ?? 0);
          showToast("¡Sello y puntos registrados con éxito!", "success");
        } catch (err: any) {
          showToast(err?.response?.data?.message || "No pudiste auto-sellar la visita", "error");
        } finally {
          setSellando(false);
        }
      },
      (error) => {
        setSellando(false);
        let msg = "No se pudo obtener tu ubicación";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Por favor concede permiso de ubicación GPS en tu navegador";
        }
        showToast(msg, "error");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const irAlMapa = () => {
    const params = new URLSearchParams();
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    if (local?.id_establecimiento || id) {
      params.set("local", String(local?.id_establecimiento || id));
    }
    navigate(`/user/explorar?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!local) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-sm text-[#8E7D7D]">Local no encontrado</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold"
        >
          Volver
        </button>
      </div>
    );
  }

  const nombre = local.nombre_comercial || local.razon_social || local.nombre || "Local";
  const banner = local.banner_url || local.imagen_portada || local.logo;
  const redes = [
    local.redes_whatsapp && {
      key: "wa",
      href: `https://wa.me/${String(local.redes_whatsapp).replace(/\D/g, "")}`,
      icon: MessageCircle,
      label: "WhatsApp",
      color: "bg-emerald-50 text-emerald-700",
    },
    local.redes_facebook && {
      key: "fb",
      href: local.redes_facebook.startsWith("http")
        ? local.redes_facebook
        : `https://facebook.com/${local.redes_facebook}`,
      icon: Facebook,
      label: "Facebook",
      color: "bg-blue-50 text-blue-700",
    },
    local.redes_instagram && {
      key: "ig",
      href: local.redes_instagram.startsWith("http")
        ? local.redes_instagram
        : `https://instagram.com/${local.redes_instagram}`,
      icon: Instagram,
      label: "Instagram",
      color: "bg-pink-50 text-pink-700",
    },
    local.redes_x && {
      key: "x",
      href: local.redes_x.startsWith("http")
        ? local.redes_x
        : `https://x.com/${local.redes_x}`,
      icon: null,
      label: "X",
      color: "bg-slate-100 text-slate-800",
    },
  ].filter(Boolean) as any[];

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-10">
      {/* Cabecera delgada blanca fija */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EFE7DE] px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E] hover:bg-[#EFE7DE] transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-xs sm:text-sm text-[#2D1A1E] truncate max-w-[200px] sm:max-w-xs">
            {nombre}
          </span>
        </div>

        <button
          onClick={toggleFav}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            esFavorito
              ? "border-[#7C0A1E] text-[#7C0A1E] bg-[#7C0A1E]/5"
              : "border-[#EFE7DE] text-[#8E7D7D] bg-[#FAF8F5]"
          }`}
          title={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart size={15} fill={esFavorito ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Banner de portada con bordes redondeados y margen suave */}
      <div className="px-4 pt-3">
        <div className="relative h-44 sm:h-52 w-full rounded-3xl overflow-hidden bg-[#2D1A1E] shadow-sm">
          {banner && (
            <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {local.categoria_nombre && (
            <span className="absolute top-3 left-3 bg-white/95 text-[#7C0A1E] font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs">
              {local.categoria_nombre}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end justify-between ml-2">
          <img
            src={
              local.logo ||
              "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
            }
            alt={nombre}
            className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-md bg-white shrink-0"
          />
          <div className="pb-1">
            <span className="text-xs font-bold text-[#C5A059] bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Sparkles size={12} />
              +{local.puntos_por_visita || 20} pts / visita
            </span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-[#2D1A1E] mt-2.5">{nombre}</h1>

        <p className="text-xs text-[#8E7D7D] mt-2 leading-relaxed">
          {local.descripcion || "Establecimiento afiliado a Pasaporte Digital NFC."}
        </p>

        <div className="mt-3.5 space-y-2 bg-white p-3.5 rounded-2xl border border-[#EFE7DE] shadow-2xs">
          {direccion && (
            <div className="flex items-start gap-2 text-xs text-[#2D1A1E]">
              <MapPin size={14} className="text-[#7C0A1E] shrink-0 mt-0.5" />
              <span>{direccion}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-[#2D1A1E]">
            <Clock size={14} className="text-[#7C0A1E] shrink-0 mt-0.5" />
            <span>{horario}</span>
          </div>
          {(local.telefono || sucursal?.telefono) && (
            <div className="flex items-start gap-2 text-xs text-[#2D1A1E]">
              <Phone size={14} className="text-[#7C0A1E] shrink-0 mt-0.5" />
              <span>{local.telefono || sucursal?.telefono}</span>
            </div>
          )}
        </div>

        {/* Sello Oficial del Local con DigitalStampBadge y Tabla bonita */}
        <div className="mt-4 bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE7DE] shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E]">
                <Stamp size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#2D1A1E]">Sello Oficial</h2>
                <p className="text-[10px] text-[#8E7D7D]">Colecciónalo con tu pasaporte NFC</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Disponible ahora
            </span>
          </div>

          <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            {/* Visualización del sello con DigitalStampBadge */}
            <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#EFE7DE] shadow-2xs min-w-[140px]">
              <DigitalStampBadge
                nombre_sello={local.nombre_sello || "Sello Oficial"}
                establecimiento_nombre={local.nombre_comercial || local.nombre || "Establecimiento"}
                imagen_sello={
                  local.imagen_sello && local.imagen_sello !== "" && local.imagen_sello !== null
                    ? local.imagen_sello
                    : (local.categoria_icono || local.icono_url || "landmark")
                }
                color_sello={local.color_sello || "#7C0A1E"}
                numero_sello={1}
                size="lg"
                rotation={-3}
              />
              <span className="text-[11px] font-bold text-[#7C0A1E] mt-2.5 text-center uppercase tracking-wider">
                {local.nombre_sello || "Sello de Visita"}
              </span>
            </div>

            {/* Tabla resumen del programa de sellos */}
            <div className="flex-1 w-full space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#EFE7DE]">
                <span className="text-[#8E7D7D] font-medium">Programa:</span>
                <span className="font-bold text-[#2D1A1E] text-right truncate max-w-[180px]">
                  {local.programa_nombre || "Pasaporte Digital"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#EFE7DE]">
                <span className="text-[#8E7D7D] font-medium">Meta del ciclo:</span>
                <span className="font-bold text-[#2D1A1E]">
                  {local.meta_sellos ? `${local.meta_sellos} sellos` : "10 sellos"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#EFE7DE]">
                <span className="text-[#8E7D7D] font-medium">Puntos por visita:</span>
                <span className="font-bold text-[#C5A059]">
                  +{local.puntos_por_visita || 20} Pts
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#8E7D7D] font-medium">Cómo coleccionarlo:</span>
                <span className="font-semibold text-[#7C0A1E] bg-[#7C0A1E]/10 px-2 py-0.5 rounded-full text-[10px]">
                  Acerca tu NFC en caja
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recompensas Disponibles en este Local */}
        {local.recompensas && (local.recompensas as any[]).length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-black text-[#2D1A1E] flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#7C0A1E]" />
              Premios y Recompensas Disponibles ({local.recompensas.length})
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {(local.recompensas as any[]).map((r: any) => {
                const imgUrl = r.imagen_url || r.imagen;
                return (
                  <div
                    key={r.id_recompensa}
                    className="bg-white rounded-2xl p-3 border border-[#EFE7DE] shadow-2xs flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-rose-50 border border-[#7C0A1E]/20 shrink-0 flex items-center justify-center">
                      {imgUrl ? (
                        <img
                          src={resolveImageUrl(imgUrl)}
                          alt={r.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Gift className="w-6 h-6 text-[#7C0A1E]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-black text-[#2D1A1E] truncate">
                        {r.nombre}
                      </h3>
                      <p className="text-[11px] text-[#8E7D7D] truncate mt-0.5">
                        {r.descripcion || "Premio canjeable en el local"}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-black text-[#7C0A1E]">
                        {r.puntos_requeridos} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {redes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {redes.map((r) => {
              const Icon = r.icon;
              return (
                <a
                  key={r.key}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${r.color}`}
                >
                  {Icon ? <Icon size={14} /> : <XIcon size={14} />}
                  {r.label}
                </a>
              );
            })}
          </div>
        )}

        {/* SECCIÓN AUTO-SELLADO PARA LUGARES TURÍSTICOS O AUTORIZADOS */}
        {permiteAutosellado && (
          <div className="mt-4 bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-[#7C0A1E]/10 rounded-3xl p-5 border border-[#C5A059]/40 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#7C0A1E] text-white flex items-center justify-center shadow-md">
                  <Stamp size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#7C0A1E] bg-white px-2 py-0.5 rounded-md border border-[#7C0A1E]/20">
                      Punto Turístico Habilitado
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-[#2D1A1E] mt-0.5">
                    Auto-sellar Pasaporte en el Lugar
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8E7D7D] leading-relaxed">
              No necesitas personal validador aquí. Si te encuentras físicamente en el lugar, valida tu presencia con tu ubicación GPS (tolerancia {radioTolerancia}m) para recibir tu sello al instante.
            </p>

            <button
              type="button"
              onClick={() => setMostrarModalAutosello(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-[#600616] hover:to-[#7C0A1E] transition-all"
            >
              <Sparkles size={16} className="text-[#C5A059]" />
              <span>AUTO-SELLAR VISITA AHORA</span>
            </button>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={irAlMapa}
            className="flex-1 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
          >
            <Navigation size={16} />
            Cómo llegar
          </button>
          <Link
            to="/user/locales"
            className="px-4 py-3 rounded-2xl border border-[#EFE7DE] bg-white text-xs font-semibold text-[#8E7D7D] flex items-center"
          >
            Ver todos
          </Link>
        </div>
      </div>

      {/* MODAL DE AUTO-SELLADO CON GEOLOCALIZACIÓN Y FOTO */}
      {mostrarModalAutosello && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative border border-[#EFE7DE]">
            {!selloExitoso ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#7C0A1E] border border-[#C5A059]/40 flex items-center justify-center mx-auto shadow-inner">
                  <MapPin size={32} />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#7C0A1E] bg-rose-50 px-2.5 py-1 rounded-full border border-[#7C0A1E]/20">
                    VERIFICACIÓN DE UBICACIÓN
                  </span>
                  <h3 className="text-lg font-black text-[#2D1A1E] mt-2">
                    Auto-sellar en {nombre}
                  </h3>
                  <p className="text-xs text-[#8E7D7D] mt-1">
                    Comprobaremos que tu dispositivo se encuentre a menos de {radioTolerancia} metros del lugar oficial.
                  </p>
                </div>

                {/* Subir foto comprobatoria si es requerida u opcional */}
                <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-3 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2D1A1E]">
                    <span className="flex items-center gap-1.5">
                      <Camera size={14} className="text-[#7C0A1E]" />
                      Foto de evidencia {requiereFoto ? "(Obligatoria)" : "(Opcional)"}
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSubirFoto(f);
                    }}
                  />

                  {fotoEvidencia ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-[#EFE7DE]">
                      <img src={fotoEvidencia} alt="Evidencia" className="w-full h-full object-cover" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1.5 right-1.5 px-2.5 py-1 bg-black/60 text-white rounded-lg text-[10px] font-bold"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={subiendoFoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl border border-dashed border-[#C5A059] bg-white text-[#7C0A1E] text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50"
                    >
                      {subiendoFoto ? <RotateCw className="w-4 h-4 animate-spin" /> : <Camera size={14} />}
                      <span>{subiendoFoto ? "Subiendo foto..." : "Tomar foto en el lugar"}</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={sellando || subiendoFoto}
                    onClick={() => {
                      setMostrarModalAutosello(false);
                      setFotoEvidencia(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-[#EFE7DE] text-xs font-bold text-[#8E7D7D] hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={sellando || subiendoFoto || (requiereFoto && !fotoEvidencia)}
                    onClick={ejecutarAutosellado}
                    className="flex-1 py-3 rounded-xl bg-[#7C0A1E] text-white text-xs font-black shadow-md hover:bg-[#600616] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {sellando ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>VERIFICANDO GPS...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>SELLAR AHORA</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* ÉXITO DE AUTO-SELLADO */
              <div className="space-y-4 py-2 animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 size={44} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    ¡AUTO-SELLADO EXITOSO!
                  </span>
                  <h3 className="text-xl font-black text-[#2D1A1E] mt-2">
                    ¡Sello Otorgado!
                  </h3>
                  <p className="text-xs text-[#8E7D7D] mt-1">
                    Verificado a {distanciaDetectada ?? 0}m de distancia del lugar.
                  </p>
                </div>

                <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-4 flex items-center justify-around">
                  <div>
                    <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Sello Obtenido</span>
                    <span className="text-base font-black text-[#7C0A1E]">
                      #{selloExitoso?.sello?.numero_sello ?? 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Puntos Ganados</span>
                    <span className="text-base font-black text-[#C5A059]">
                      +{selloExitoso?.puntos?.puntos_ganados ?? 20} pts
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalAutosello(false);
                    setSelloExitoso(null);
                    setFotoEvidencia(null);
                    navigate("/user/mis-sellos");
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-black shadow-md hover:bg-[#600616]"
                >
                  VER MI PASAPORTE Y SELLOS
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
