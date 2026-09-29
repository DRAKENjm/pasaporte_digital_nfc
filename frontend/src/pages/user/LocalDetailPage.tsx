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
} from "lucide-react";
import { resolveImageUrl } from "../../components/common/DigitalStampBadge";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";

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
      {/* Banner estilo perfil X */}
      <div className="relative h-36 bg-[#7C0A1E]">
        {banner && (
          <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={toggleFav}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center ${
            esFavorito ? "bg-[#7C0A1E] text-white" : "bg-black/40 text-white"
          }`}
        >
          <Heart size={16} fill={esFavorito ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <img
          src={
            local.logo ||
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
          }
          alt={nombre}
          className="w-20 h-20 rounded-full border-4 border-[#FAF8F5] object-cover shadow-md bg-white"
        />

        <h1 className="text-xl font-bold text-[#2D1A1E] mt-2">{nombre}</h1>
        {local.categoria_nombre && (
          <span className="inline-block mt-1 text-[10px] font-bold bg-[#C5A059]/20 text-[#7C0A1E] px-2 py-0.5 rounded-full">
            {local.categoria_nombre}
          </span>
        )}

        <p className="text-xs text-[#8E7D7D] mt-3 leading-relaxed">
          {local.descripcion || "Establecimiento afiliado a Pasaporte Digital NFC."}
        </p>

        <div className="mt-4 space-y-2">
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
    </div>
  );
};
