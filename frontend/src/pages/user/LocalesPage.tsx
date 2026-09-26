import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  MapPin,
  Search,
  Clock,
  Navigation,
  ArrowLeft,
  Award,
  ChevronRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { useUI } from "../../hooks/useUI";

export const LocalesPage: React.FC = () => {
  const [locales, setLocales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const { showToast } = useUI();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const { data } = await api.get("/establishments");
        const list = data?.data ?? data ?? [];
        setLocales(Array.isArray(list) ? list : []);
      } catch (err) {
        showToast("No se pudieron cargar los locales afiliados", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchLocales();
  }, [showToast]);

  const filtrados = locales.filter((l) => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;
    const nombre = (l.nombre_comercial || l.razon_social || l.nombre || "").toLowerCase();
    const desc = (l.descripcion || "").toLowerCase();
    const dir = (l.sucursales?.[0]?.direccion || l.direccion || "").toLowerCase();
    return nombre.includes(term) || desc.includes(term) || dir.includes(term);
  });

  const abrirEnMaps = (e: React.MouseEvent, l: any) => {
    e.stopPropagation();
    const sucursal = l.sucursales?.[0];
    const lat = sucursal?.latitud;
    const lng = sucursal?.longitud;
    const dir = sucursal?.direccion || l.direccion || l.nombre_comercial;

    let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] p-4 sm:p-5 pb-24 flex flex-col max-w-md mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4 pt-1">
        <Link
          to="/user/home"
          className="w-10 h-10 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E] shadow-2xs hover:bg-[#FAF8F5] transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#2D1A1E] flex items-center gap-1.5">
            <Store size={20} className="text-[#7C0A1E]" />
            Locales Afiliados
          </h1>
          <p className="text-xs text-[#8E7D7D]">
            Visita, colecciona sellos y suma puntos con tu NFC
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E7D7D]" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar local por nombre o dirección..."
          className="w-full bg-white border border-[#EFE7DE] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#2D1A1E] placeholder:text-[#8E7D7D]/70 focus:outline-none focus:border-[#7C0A1E] shadow-2xs transition-all"
        />
      </div>

      {/* Lista de Locales */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center my-auto shadow-2xs">
          <Store className="w-12 h-12 text-[#C5A059] mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#2D1A1E]">No se encontraron locales</h3>
          <p className="text-xs text-[#8E7D7D] mt-1">
            Intenta con otro término de búsqueda o regresa más tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtrados.map((l) => {
            const id = l.id_establecimiento || l.id;
            const sucursalPrincipal = l.sucursales?.[0];
            const direccion = sucursalPrincipal?.direccion || l.direccion || "Chiclayo, Lambayeque";
            const horario = l.horario_atencion || "Lun a Sáb: 8:00 AM - 10:00 PM";
            const puntosVisita = l.puntos_por_visita || 20;
            const imagenPortada =
              l.imagen_portada ||
              "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80";

            return (
              <div
                key={id}
                onClick={() => navigate(`/user/locales/${id}`)}
                className="bg-white rounded-3xl border border-[#EFE7DE] overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Portada del Local */}
                <div className="relative w-full h-36 overflow-hidden">
                  <img
                    src={imagenPortada}
                    alt={l.nombre_comercial}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Logo sobre la portada */}
                  <div className="absolute bottom-3 left-4 flex items-center space-x-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#C5A059] p-0.5 shadow-md overflow-hidden shrink-0">
                      <img
                        src={
                          l.logo ||
                          "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=150"
                        }
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="text-white">
                      <h3 className="font-bold text-base leading-tight drop-shadow-sm">
                        {l.nombre_comercial || l.razon_social}
                      </h3>
                      <span className="text-[10px] text-[#E8D3A2] font-semibold uppercase tracking-wider block">
                        {l.categoria_nombre || "Cafetería & Experiencia"}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Puntos */}
                  <div className="absolute top-3 right-3 bg-[#7C0A1E] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Award size={12} className="text-[#C5A059]" />
                    <span>+{puntosVisita} pts</span>
                  </div>
                </div>

                {/* Contenido / Información */}
                <div className="p-4 space-y-2.5">
                  <p className="text-xs text-[#8E7D7D] line-clamp-2">
                    {l.descripcion ||
                      "Disfruta de la mejor atención, suma sellos digitales y obtén recompensas exclusivas."}
                  </p>

                  <div className="space-y-1.5 pt-1 text-[11px] text-[#2D1A1E]">
                    {/* Horario */}
                    <div className="flex items-center space-x-2 text-[#8E7D7D]">
                      <Clock size={13} className="text-[#7C0A1E] shrink-0" />
                      <span className="truncate">{horario}</span>
                    </div>

                    {/* Dirección */}
                    <div className="flex items-center space-x-2 text-[#8E7D7D]">
                      <MapPin size={13} className="text-[#7C0A1E] shrink-0" />
                      <span className="truncate">{direccion}</span>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-[#EFE7DE]">
                    <button
                      type="button"
                      onClick={(e) => abrirEnMaps(e, l)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] hover:border-[#C5A059] text-[11px] font-bold text-[#7C0A1E] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Navigation size={13} />
                      <span>Ver dirección</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/user/locales/${id}`)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#7C0A1E] hover:bg-[#600616] text-[11px] font-bold text-white flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>Ver detalles</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
