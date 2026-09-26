import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  CreditCard,
  Store,
  Stamp,
  Gift,
  ChevronRight,
  ArrowRight,
  Award,
  MapPin,
  X,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";

interface DashboardData {
  puntos_actuales: number;
  total_visitas: number;
  total_sellos: number;
  locales_visitados: number;
  nivel: {
    nombre: string;
    color: string;
    visitas_actuales: number;
    visitas_meta: number;
  };
}

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [locales, setLocales] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, localesRes, feedRes, notifRes] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/establishments"),
          api.get("/activity/feed").catch(() => ({ data: { data: { visitas_recientes: [] } } })),
          api.get("/activity/notificaciones").catch(() => ({ data: { data: [] } })),
        ]);
        setData(profileRes.data.data);
        setLocales(localesRes.data?.data || []);
        setVisitas(feedRes.data?.data?.visitas_recientes || []);
        setNotificaciones(notifRes.data?.data || []);
      } catch (err) {
        console.error("Error cargando datos de inicio", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifDropdown]);

  // Si hay más de 1 local registrado, auto-slide cada 5 segundos
  useEffect(() => {
    if (locales.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % locales.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [locales.length]);

  // Puntos y progreso
  const puntosActuales = data?.puntos_actuales ?? user?.puntos_globales ?? 0;
  const puntosMeta = 1000;
  const puntosProgreso = Math.min(100, Math.round((puntosActuales / puntosMeta) * 100));
  const puntosRestantes = Math.max(0, puntosMeta - puntosActuales);
  const nivelActual = data?.nivel?.nombre || "Nivel Iniciador";
  const unreadNotifs = notificaciones.filter((n) => !n.leida).length;

  // Local actual para el banner "Descubre nuevas experiencias"
  const currentLocal = locales[activeSlide] || locales[0] || null;

  return (
    <div className="w-full flex flex-col p-4 sm:p-5 pb-8 animate-fadeIn space-y-5 bg-[#FAF8F5] relative">
      {/* 1. Header Superior: Logo Circular + Campana de Notificaciones con Dropdown */}
      <div className="flex items-center justify-between pt-1 relative z-30">
        <Link
          to="/user/home"
          className="w-11 h-11 rounded-full bg-[#7C0A1E] border-2 border-[#C5A059] p-1.5 flex items-center justify-center shadow-md shadow-[#7C0A1E]/15 hover:scale-105 transition-transform"
        >
          <img
            src="/logo-icon.png"
            alt="Pasaporte Digital"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </Link>

        {/* Campana y Popover Desplegable */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifDropdown((prev) => !prev)}
            className="w-11 h-11 rounded-full bg-[#7C0A1E] text-white flex items-center justify-center shadow-md shadow-[#7C0A1E]/20 hover:bg-[#630718] transition-all relative active:scale-95"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            {unreadNotifs > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#C5A059] border-2 border-[#FAF8F5] rounded-full" />
            )}
          </button>

          {/* Menú Flotante de Notificaciones */}
          {showNotifDropdown && (
            <div className="absolute right-0 top-14 w-80 sm:w-88 bg-white border border-[#EFE7DE] rounded-3xl shadow-xl p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DE]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#2D1A1E]">Notificaciones</span>
                  {unreadNotifs > 0 && (
                    <span className="bg-[#7C0A1E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadNotifs} nuevas
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(false)}
                  className="w-7 h-7 rounded-full bg-[#FAF8F5] text-[#8E7D7D] hover:text-[#2D1A1E] flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Lista */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#EFE7DE]/60 my-2">
                {notificaciones.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8E7D7D]">
                    <Bell size={24} className="mx-auto mb-2 text-[#C5A059]/60" />
                    No tienes avisos pendientes
                  </div>
                ) : (
                  notificaciones.slice(0, 5).map((n) => (
                    <div
                      key={n.id_notificacion}
                      className={`p-2.5 rounded-xl transition-colors ${
                        n.leida ? "bg-white" : "bg-[#FFF9F5]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-[#2D1A1E] leading-snug">
                          {n.titulo}
                        </h4>
                        <span className="text-[9px] text-[#8E7D7D] ml-2 shrink-0">
                          {new Date(n.fecha_creacion).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E7D7D] mt-1 leading-relaxed">
                        {n.mensaje}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[#EFE7DE] flex justify-between items-center text-[11px]">
                <Link
                  to="/user/actividad"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[#7C0A1E] font-bold hover:underline"
                >
                  Ver toda la actividad
                </Link>
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[#8E7D7D] hover:text-[#2D1A1E]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sección Nivel y Barra de Progreso */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            {/* Roseta de premio bordada */}
            <div className="w-8 h-8 rounded-full bg-[#7C0A1E] border-2 border-[#C5A059] flex items-center justify-center shadow-xs text-[#C5A059]">
              <Award size={16} fill="#C5A059" className="text-[#C5A059]" />
            </div>
            <span className="text-sm font-bold text-[#2D1A1E]">{nivelActual}</span>
          </div>
          <span className="text-sm font-semibold text-[#2D1A1E]">Nivel Socio</span>
        </div>

        {/* Barra de progreso redondeada color vino */}
        <div className="w-full bg-[#E5DCD0] h-2.5 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-[#7C0A1E] h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(8, puntosProgreso)}%` }}
          />
        </div>

        {/* Metas en puntos debajo de la barra */}
        <div className="flex items-center justify-between text-xs text-[#2D1A1E] mt-1.5 font-medium">
          <span>
            <strong className="text-[#7C0A1E] font-bold">{puntosActuales}</strong> / {puntosMeta} Pts
          </span>
          <span className="text-[#8E7D7D]">
            {puntosRestantes > 0 ? `${puntosRestantes} / ${puntosMeta} Pts` : "¡Meta alcanzada!"}
          </span>
        </div>
      </div>

      {/* 3. Accesos Rápidos: 4 Cards (Mi Tarjeta, Locales con Icono Store, Mis Sellos, Premios) */}
      <div className="grid grid-cols-4 gap-2.5">
        <Link
          to="/user/pasaporte"
          className="bg-white/90 border border-[#EFE7DE] hover:border-[#C5A059]/50 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-[0_4px_16px_rgba(45,26,30,0.04)] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] mb-2 group-hover:scale-105 transition-transform shadow-2xs">
            <CreditCard size={22} strokeWidth={2.2} />
          </div>
          <span className="font-bold text-[11px] text-[#2D1A1E] leading-tight">Mi Tarjeta</span>
          <span className="text-[9px] text-[#8E7D7D] mt-0.5">Ver pasaporte</span>
        </Link>

        {/* Locales -> Ahora con icono Store y ruta dedicada /user/locales */}
        <Link
          to="/user/locales"
          className="bg-white/90 border border-[#EFE7DE] hover:border-[#C5A059]/50 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-[0_4px_16px_rgba(45,26,30,0.04)] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] mb-2 group-hover:scale-105 transition-transform shadow-2xs">
            <Store size={22} strokeWidth={2.2} />
          </div>
          <span className="font-bold text-[11px] text-[#2D1A1E] leading-tight">Locales</span>
          <span className="text-[9px] text-[#8E7D7D] mt-0.5">Establecimientos</span>
        </Link>

        <Link
          to="/user/actividad"
          className="bg-white/90 border border-[#EFE7DE] hover:border-[#C5A059]/50 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-[0_4px_16px_rgba(45,26,30,0.04)] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] mb-2 group-hover:scale-105 transition-transform shadow-2xs">
            <Stamp size={22} strokeWidth={2.2} />
          </div>
          <span className="font-bold text-[11px] text-[#2D1A1E] leading-tight">Mis Sellos</span>
          <span className="text-[9px] text-[#8E7D7D] mt-0.5">Tu colección</span>
        </Link>

        <Link
          to="/user/rewards"
          className="bg-white/90 border border-[#EFE7DE] hover:border-[#C5A059]/50 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-[0_4px_16px_rgba(45,26,30,0.04)] hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] mb-2 group-hover:scale-105 transition-transform shadow-2xs">
            <Gift size={22} strokeWidth={2.2} />
          </div>
          <span className="font-bold text-[11px] text-[#2D1A1E] leading-tight">Premios</span>
          <span className="text-[9px] text-[#8E7D7D] mt-0.5">Canjear beneficios</span>
        </Link>
      </div>

      {/* 4. "Descubre nuevas experiencias" (Basado 100% en los locales reales) */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-base sm:text-lg font-bold text-[#2D1A1E]">
            Descubre nuevas experiencias
          </h2>
          <Link
            to="/user/locales"
            className="text-xs font-semibold text-[#7C0A1E] hover:underline flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {currentLocal ? (
          <div className="relative w-full h-52 sm:h-56 rounded-[1.75rem] overflow-hidden shadow-md group">
            <img
              src={
                currentLocal.imagen_portada ||
                "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"
              }
              alt={currentLocal.nombre_comercial}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Degradado oscuro elegante */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

            {/* Contenido sobre la imagen */}
            <div className="relative h-full flex flex-col justify-between p-4 sm:p-5 z-10 text-white">
              <div>
                <span className="inline-block bg-[#C5A059]/25 text-[#E8D3A2] border border-[#C5A059]/60 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase backdrop-blur-xs">
                  LOCAL DESTACADO
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5 drop-shadow-sm">
                  {currentLocal.nombre_comercial || currentLocal.razon_social}
                </h3>
                <p className="text-xs text-white/90 line-clamp-1 max-w-[80%] mt-0.5">
                  {currentLocal.descripcion ||
                    "Disfruta un ambiente único y suma un sello exclusivo con tu pasaporte."}
                </p>
                <p className="text-xs font-semibold text-[#E8D3A2] mt-0.5">
                  {currentLocal.programa_nombre
                    ? `Programa: ${currentLocal.programa_nombre}`
                    : "Suma sellos y acumula puntos con tu NFC"}
                </p>
              </div>

              {/* Fila Inferior: Botón de acción + Ubicación */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/user/locales/${currentLocal.id_establecimiento || currentLocal.id}`
                    )
                  }
                  className="bg-white text-[#2D1A1E] hover:bg-white/90 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>Conocer local</span>
                  <ArrowRight size={14} className="text-[#7C0A1E]" />
                </button>

                <div className="bg-white/90 text-[#2D1A1E] text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs max-w-[50%] truncate">
                  <MapPin size={12} className="text-[#7C0A1E] shrink-0" />
                  <span className="truncate">
                    {currentLocal.sucursales?.[0]?.direccion || "Chiclayo, Perú"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-44 rounded-[1.75rem] bg-[#EFE7DE]/50 border border-dashed border-[#C5A059]/40 flex flex-col items-center justify-center p-5 text-center">
            <Store className="w-10 h-10 text-[#C5A059] mb-2" />
            <h4 className="text-sm font-bold text-[#2D1A1E]">Pronto nuevos locales</h4>
            <p className="text-xs text-[#8E7D7D] mt-1 max-w-xs">
              Estamos afiliando nuevos establecimientos para que disfrutes y colecciones sellos.
            </p>
          </div>
        )}

        {/* Indicadores de paginación del carrusel (solo si hay más de 1 local registrado) */}
        {locales.length > 1 && (
          <div className="flex justify-center items-center space-x-1.5 mt-3">
            {locales.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  activeSlide === idx ? "w-6 bg-[#7C0A1E]" : "w-1.5 bg-[#D8CEBE]"
                }`}
                aria-label={`Local ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. "Tus últimos sellos" (Solo muestra sellos REALES recibidos) */}
      <div className="w-full bg-white/70 backdrop-blur-xs rounded-[2rem] p-4 sm:p-5 border border-[#EFE7DE] shadow-[0_4px_20px_rgba(45,26,30,0.03)]">
        <div className="flex items-center justify-between mb-3.5 px-0.5">
          <h3 className="text-base font-bold text-[#2D1A1E]">Tus últimos sellos</h3>
          <Link
            to="/user/actividad"
            className="text-xs font-semibold text-[#7C0A1E] hover:underline flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {/* Si el cliente tiene sellos reales recibidos */}
        {visitas.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {visitas.slice(0, 6).map((v, idx) => (
              <div
                key={v.id_visita || idx}
                className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-2 flex flex-col items-center text-center shadow-xs hover:border-[#C5A059]/40 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Sello Digital Oficial del Local */}
                <div className="my-1 flex items-center justify-center shrink-0">
                  <DigitalStampBadge
                    nombre_sello={v.nombre_sello}
                    establecimiento_nombre={v.establecimiento_nombre}
                    imagen_sello={v.imagen_sello || "☕"}
                    color_sello={v.color_sello || "#7C0A1E"}
                    numero_sello={v.numero_sello || 1}
                    fecha={v.fecha_hora}
                    size="sm"
                    rotation={-2}
                  />
                </div>

                {/* Nombre del local */}
                <span className="font-bold text-[11px] text-[#2D1A1E] truncate w-full mt-1">
                  {v.establecimiento_nombre || "Local Afiliado"}
                </span>

                {/* Fecha */}
                <span className="text-[10px] text-[#8E7D7D] mt-0.5 font-medium">
                  {new Date(v.fecha_hora).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Estado Vacío Auténtico: No se muestran sellos ficticios si no ha recibido ninguno */
          <div className="py-7 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#C5A059]/40 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#C5A059] flex items-center justify-center text-[#7C0A1E] mb-2.5 bg-white">
              <Stamp size={22} className="text-[#7C0A1E]" />
            </div>
            <h4 className="text-xs font-bold text-[#2D1A1E]">Sin sellos registrados aún</h4>
            <p className="text-[11px] text-[#8E7D7D] mt-1 max-w-xs leading-relaxed">
              Acércate a un local afiliado con tu pasaporte NFC para recibir tu primer sello oficial.
            </p>
            <Link
              to="/user/locales"
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold bg-[#7C0A1E] hover:bg-[#600616] text-white px-4 py-2 rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Store size={14} />
              <span>Ver locales afiliados</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
