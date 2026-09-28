import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Stamp,
  Coffee,
  Utensils,
  Wine,
  Cake,
  ShoppingBag,
  Landmark,
  Gamepad2,
  Scissors,
  Compass,
  MapPin,
  X,
  Instagram,
  Facebook,
  MessageCircle,
  Navigation,
  Store,
  Sparkles,
  CheckCircle2,
  Award,
  ChevronRight,
  Search,
} from "lucide-react";
import api from "../../services/api";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";

interface SelloDetalle {
  id_sello: number;
  numero_sello: number;
  fecha_otorgamiento: string;
}

interface Recompensa {
  id_recompensa: number;
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
}

interface EstablecimientoSellos {
  id_establecimiento: string | number;
  nombre_comercial: string;
  razon_social?: string;
  descripcion?: string;
  logo?: string;
  imagen_portada?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  categoria_id?: number;
  categoria_nombre?: string;
  categoria_icono?: string;
  id_programa?: number;
  programa_nombre?: string;
  programa_descripcion?: string;
  meta_sellos: number;
  nombre_sello: string;
  imagen_sello?: string;
  color_sello: string;
  sellos_obtenidos: number;
  sellos_detalle: SelloDetalle[];
  recompensas: Recompensa[];
}

export const MisSellosPage: React.FC = () => {
  const navigate = useNavigate();
  const [localesSellos, setLocalesSellos] = useState<EstablecimientoSellos[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [localModal, setLocalModal] = useState<EstablecimientoSellos | null>(null);

  // Cargar sellos del usuario por establecimiento
  useEffect(() => {
    const fetchMisSellos = async () => {
      try {
        setLoading(true);
        const res = await api.get("/activity/mis-sellos");
        setLocalesSellos(res.data?.data || []);
      } catch (err) {
        console.error("Error al cargar sellos", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMisSellos();
  }, []);

  // Icono para la categoría
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case "coffee":
        return Coffee;
      case "utensils":
        return Utensils;
      case "martini":
      case "wine":
        return Wine;
      case "croissant":
      case "cake":
        return Cake;
      case "shopping-bag":
        return ShoppingBag;
      case "landmark":
        return Landmark;
      case "gamepad":
        return Gamepad2;
      case "scissors":
        return Scissors;
      default:
        return Compass;
    }
  };

  // Lista única de categorías
  const categoriasDisponibles = useMemo(() => {
    const setCats = new Set<string>();
    localesSellos.forEach((l) => {
      if (l.categoria_nombre) setCats.add(l.categoria_nombre);
    });
    return ["Todas", ...Array.from(setCats)];
  }, [localesSellos]);

  // Filtrado por categoría y búsqueda
  const localesFiltrados = useMemo(() => {
    return localesSellos.filter((l) => {
      const matchCat =
        categoriaSeleccionada === "Todas" || l.categoria_nombre === categoriaSeleccionada;
      const matchBusqueda =
        !busqueda.trim() ||
        l.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.categoria_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.nombre_sello?.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusqueda;
    });
  }, [localesSellos, categoriaSeleccionada, busqueda]);

  // Agrupación por categoría
  const gruposPorCategoria = useMemo(() => {
    const map = new Map<string, EstablecimientoSellos[]>();
    localesFiltrados.forEach((l) => {
      const cat = l.categoria_nombre || "Otras Experiencias";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(l);
    });
    return Array.from(map.entries());
  }, [localesFiltrados]);

  // Total de sellos acumulados
  const totalSellosAcumulados = useMemo(() => {
    return localesSellos.reduce((acc, curr) => acc + (curr.sellos_obtenidos || 0), 0);
  }, [localesSellos]);

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col pb-28">
      {/* 1. Header con botón regresar y título */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EFE7DE] px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/user/home")}
              className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E] hover:bg-[#7C0A1E] hover:text-white transition-all cursor-pointer"
              title="Volver al inicio"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold text-[#2D1A1E] flex items-center gap-1.5 leading-tight">
                <span>Mis Sellos</span>
                <Stamp size={16} className="text-[#7C0A1E]" />
              </h1>
              <p className="text-[10px] text-[#8E7D7D]">Cartillas por establecimiento</p>
            </div>
          </div>

          {/* Insignia contador total */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#7C0A1E]/10 border border-[#7C0A1E]/20 rounded-full text-[#7C0A1E] text-xs font-bold shadow-2xs">
            <Award size={13} className="text-[#C5A059]" />
            <span>{totalSellosAcumulados} sellos</span>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative flex items-center mt-3">
          <Search size={15} className="absolute left-3 text-[#8E7D7D]" />
          <input
            type="text"
            placeholder="Buscar por local o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl pl-8.5 pr-8 py-1.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none focus:ring-1 focus:ring-[#7C0A1E]"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 text-[#8E7D7D] hover:text-[#7C0A1E]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Píldoras de Categorías */}
        <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 scrollbar-none">
          {categoriasDisponibles.map((cat) => {
            const activo = categoriaSeleccionada === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activo
                    ? "bg-[#7C0A1E] text-white shadow-xs"
                    : "bg-[#FAF8F5] text-[#8E7D7D] border border-[#EFE7DE] hover:border-[#7C0A1E]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Contenido Principal */}
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-3 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#8E7D7D]">Cargando tu colección de sellos...</p>
          </div>
        ) : gruposPorCategoria.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center my-6 shadow-xs">
            <Stamp className="w-12 h-12 text-[#C5A059] mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">No se encontraron sellos</h3>
            <p className="text-xs text-[#8E7D7D] mt-1 max-w-xs mx-auto">
              {busqueda
                ? "No hay locales que coincidan con tu búsqueda."
                : "Visita los locales afiliados para recibir tu primer sello digital con tu tarjeta NFC."}
            </p>
            <Link
              to="/user/locales"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#630718] transition-all"
            >
              <Store size={14} />
              <span>Explorar locales afiliados</span>
            </Link>
          </div>
        ) : (
          /* Grupos por Categoría */
          gruposPorCategoria.map(([categoriaNombre, items]) => {
            const Icon = getCategoryIcon(items[0]?.categoria_icono);

            return (
              <div key={categoriaNombre} className="space-y-3">
                {/* Cabecera de Categoría */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-[#7C0A1E]/10 text-[#7C0A1E] flex items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <h2 className="text-sm font-bold text-[#2D1A1E]">{categoriaNombre}</h2>
                  </div>
                  <span className="text-[11px] text-[#8E7D7D] font-medium">
                    {items.length} {items.length === 1 ? "establecimiento" : "establecimientos"}
                  </span>
                </div>

                {/* Grid de Sellos: Un sello por establecimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {items.map((item) => {
                    const progreso = Math.min(
                      100,
                      Math.round(((item.sellos_obtenidos || 0) / item.meta_sellos) * 100)
                    );
                    const tieneSellos = (item.sellos_obtenidos || 0) > 0;

                    return (
                      <div
                        key={item.id_establecimiento}
                        onClick={() => setLocalModal(item)}
                        className="bg-white rounded-3xl p-4 border border-[#EFE7DE] shadow-sm hover:shadow-md hover:border-[#C5A059]/60 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
                      >
                        {/* Indicador superior */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tieneSellos
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-[#FAF8F5] text-[#8E7D7D] border border-[#EFE7DE]"
                            }`}
                          >
                            {tieneSellos
                              ? `${item.sellos_obtenidos} sellos acumulados`
                              : "Sin sellos aún"}
                          </span>

                          <span className="text-[10px] text-[#8E7D7D] font-medium flex items-center gap-0.5 group-hover:text-[#7C0A1E] transition-colors">
                            Ver cartilla <ChevronRight size={12} />
                          </span>
                        </div>

                        {/* Centro: Sello digital destacado del local */}
                        <div className="flex items-center space-x-3.5 my-1">
                          <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
                            <DigitalStampBadge
                              nombre_sello={item.nombre_sello}
                              establecimiento_nombre={item.nombre_comercial}
                              imagen_sello={item.imagen_sello || item.logo || "☕"}
                              color_sello={item.color_sello || "#7C0A1E"}
                              size="sm"
                              rotation={-2}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-[#2D1A1E] truncate group-hover:text-[#7C0A1E] transition-colors">
                              {item.nombre_comercial}
                            </h3>
                            <p className="text-[11px] text-[#8E7D7D] truncate mt-0.5">
                              {item.direccion || "Chiclayo"}
                            </p>
                            <p className="text-[10px] font-semibold text-[#C5A059] mt-1 truncate">
                              Programa: {item.programa_nombre}
                            </p>
                          </div>
                        </div>

                        {/* Barra de progreso de sellos */}
                        <div className="mt-3 pt-2.5 border-t border-[#EFE7DE]/70">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-[#8E7D7D]">Progreso de la meta</span>
                            <span className="font-bold text-[#2D1A1E]">
                              {item.sellos_obtenidos} / {item.meta_sellos} sellos
                            </span>
                          </div>
                          <div className="w-full bg-[#FAF8F5] border border-[#EFE7DE] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(6, progreso)}%`,
                                backgroundColor: item.color_sello || "#7C0A1E",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Panel Modal Bottom-Sheet que cubre la mitad de la pantalla */}
      {localModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn">
          {/* Fondo oscuro traslúcido */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setLocalModal(null)}
          />

          {/* Tarjeta Bottom Sheet que cubre la mitad de la pantalla */}
          <div
            className="w-full max-w-md bg-white rounded-t-[2rem] shadow-2xl z-50 overflow-hidden flex flex-col border-t border-[#EFE7DE] animate-slideUp relative"
            style={{ maxHeight: "78vh" }}
          >
            {/* Píldora de arrastre superior */}
            <div className="absolute top-2 inset-x-0 flex justify-center z-30 pointer-events-none">
              <div className="w-12 h-1.5 bg-white/70 rounded-full shadow-xs" />
            </div>

            {/* Banner de fondo detrás */}
            <div className="relative w-full h-28 sm:h-32 shrink-0 bg-[#2D1A1E]">
              <img
                src={
                  localModal.imagen_portada ||
                  localModal.logo ||
                  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80"
                }
                alt=""
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />

              {/* Botón Cerrar */}
              <button
                onClick={() => setLocalModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all cursor-pointer z-20"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo del Modal con scroll suave */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-0 space-y-4">
              {/* Foto del lugar y datos principales */}
              <div className="flex items-start justify-between -mt-9 relative z-10">
                <div className="flex items-end space-x-3">
                  <img
                    src={
                      localModal.logo ||
                      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                    }
                    alt={localModal.nombre_comercial}
                    className="w-18 h-18 rounded-2xl object-cover border-3 border-white shadow-md bg-white shrink-0"
                  />
                  <div className="pb-1">
                    <span className="text-[10px] font-bold text-[#7C0A1E] bg-[#7C0A1E]/10 px-2 py-0.5 rounded-full inline-block">
                      {localModal.categoria_nombre || "Comercio Afiliado"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <span className="text-xs font-bold text-[#C5A059] block">
                    {localModal.sellos_obtenidos} de {localModal.meta_sellos}
                  </span>
                  <span className="text-[9px] text-[#8E7D7D]">Sellos reunidos</span>
                </div>
              </div>

              {/* Nombre y Dirección */}
              <div>
                <h2 className="text-lg font-bold text-[#2D1A1E] leading-tight">
                  {localModal.nombre_comercial}
                </h2>
                <p className="text-xs text-[#8E7D7D] flex items-center gap-1 mt-1">
                  <MapPin size={13} className="text-[#7C0A1E] shrink-0" />
                  <span>{localModal.direccion || "Chiclayo"}</span>
                </p>
              </div>

              {/* Pequeña inscripción / lema del establecimiento */}
              {localModal.descripcion && (
                <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-2.5 text-xs text-[#2D1A1E] italic flex items-start gap-2 shadow-2xs">
                  <Sparkles size={14} className="text-[#C5A059] shrink-0 mt-0.5" />
                  <p className="leading-snug">"{localModal.descripcion}"</p>
                </div>
              )}

              {/* Botones de Redes Sociales y Acciones Rápidas */}
              <div className="flex items-center justify-between gap-2 pt-1 pb-1">
                {/* Instagram */}
                <a
                  href={`https://instagram.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-2 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  title="Ver en Instagram"
                >
                  <Instagram size={14} />
                  <span>Instagram</span>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${localModal.telefono ? localModal.telefono.replace(/\D/g, "") : "51987654321"}?text=Hola%20${encodeURIComponent(localModal.nombre_comercial)}%2C%20los%20encontr%C3%A9%20en%20Pasaporte%20NFC`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-2 rounded-2xl bg-[#25D366] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#20ba5a] transition-all cursor-pointer"
                  title="Contactar por WhatsApp"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://facebook.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-2 rounded-2xl bg-[#1877F2] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#166fe5] transition-all cursor-pointer"
                  title="Ver en Facebook"
                >
                  <Facebook size={14} />
                  <span>Facebook</span>
                </a>

                {/* Cómo llegar / Ubicación */}
                <Link
                  to="/user/explorar"
                  className="w-9 h-9 rounded-2xl bg-[#7C0A1E] text-white flex items-center justify-center shadow-xs hover:bg-[#600616] transition-all shrink-0 cursor-pointer"
                  title="Ver en el mapa"
                >
                  <Navigation size={15} />
                </Link>
              </div>

              {/* 4. Abajo: Diseño de sus sellos con la cantidad de la meta */}
              <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-3xl p-4 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Stamp size={16} className="text-[#7C0A1E]" />
                    <span className="text-xs font-bold text-[#2D1A1E]">
                      Cartilla: {localModal.programa_nombre}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#7C0A1E]">
                    {localModal.sellos_obtenidos} / {localModal.meta_sellos} Sellos
                  </span>
                </div>

                {/* Cuadrícula de Sellos Interactiva (Muestra exactamente la meta de sellos del local) */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-1">
                  {Array.from({ length: localModal.meta_sellos }).map((_, index) => {
                    const numeroSello = index + 1;
                    const obtenido = numeroSello <= (localModal.sellos_obtenidos || 0);

                    return (
                      <div
                        key={numeroSello}
                        className={`aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-center relative transition-transform ${
                          obtenido
                            ? "bg-white border-2 shadow-xs scale-102"
                            : "bg-white/60 border-2 border-dashed border-[#DDD2C4]"
                        }`}
                        style={{
                          borderColor: obtenido ? localModal.color_sello || "#7C0A1E" : undefined,
                        }}
                      >
                        {obtenido ? (
                          <>
                            {/* Insignia / Marca del sello obtenido */}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                              {localModal.imagen_sello &&
                              (localModal.imagen_sello.startsWith("http") ||
                                localModal.imagen_sello.startsWith("/")) ? (
                                <img
                                  src={localModal.imagen_sello}
                                  alt=""
                                  className="w-full h-full object-contain filter drop-shadow-xs"
                                />
                              ) : (
                                <span className="text-lg leading-none">
                                  {localModal.imagen_sello || "☕"}
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[8px] font-black tracking-tight mt-0.5"
                              style={{ color: localModal.color_sello || "#7C0A1E" }}
                            >
                              #{numeroSello}
                            </span>
                            {/* Checkmark dorado de sello ganado */}
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C5A059] text-white flex items-center justify-center shadow-xs">
                              <CheckCircle2 size={10} strokeWidth={3} />
                            </span>
                          </>
                        ) : (
                          <>
                            {/* Espacio pendiente por sellar */}
                            <span className="text-xs font-bold text-[#8E7D7D]/60">
                              #{numeroSello}
                            </span>
                            <span className="text-[7.5px] font-medium text-[#8E7D7D]/50 uppercase tracking-tighter mt-0.5">
                              NFC
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Beneficio o recompensa al completar */}
                <div className="p-2.5 rounded-2xl bg-white border border-[#EFE7DE] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center shrink-0">
                    <Award size={18} />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <p className="font-bold text-[#2D1A1E]">
                      {localModal.recompensas?.[0]?.nombre ||
                        `¡Completa los ${localModal.meta_sellos} sellos y gana tu recompensa!`}
                    </p>
                    <p className="text-[#8E7D7D] text-[10px] mt-0.5">
                      {localModal.recompensas?.[0]?.descripcion ||
                        "Presenta tu tarjeta NFC en caja cada vez que visites este local."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
