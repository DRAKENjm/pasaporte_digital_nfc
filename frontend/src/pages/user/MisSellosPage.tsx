import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Stamp,
  Coffee,
  Utensils,
  Wine,
  Cake,
  ShoppingBag,
  Landmark,
  Compass,
  X,
  Share2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Store,
  Clock,
  BookOpen,
  Filter,
  ArrowUpDown,
  ExternalLink,
  BookMarked,
  LayoutList,
  MapPin,
  CheckCircle2,
  Award,
  Sparkles,
  Crown,
} from "lucide-react";
import api from "../../services/api";
import { DigitalStampBadge, isImageUrl, resolveImageUrl } from "../../components/common/DigitalStampBadge";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { StampShareModal } from "../../components/common/StampShareModal";
import { StampShareData } from "../../utils/shareStampCard";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { DisenoSelloLocal } from "../../types";
import { getStampIcon } from "../../utils/stampIcons";

interface SelloDetalle {
  id_sello: number;
  numero_sello: number;
  fecha_otorgamiento: string;
  es_festivo?: number;
  es_sello_especial?: boolean;
  periodo_referencia?: string;
  ciclo_numero?: number;
  imagen_sello_url?: string;
  nombre_sello?: string;
  color_sello?: string;
}

interface EstablecimientoSellos {
  id_establecimiento: string | number;
  nombre_comercial: string;
  razon_social?: string;
  descripcion?: string;
  logo?: string;
  imagen_portada?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  google_maps_url?: string;
  categoria_nombre?: string;
  categoria_icono?: string;
  programa_nombre?: string;
  meta_sellos: number;
  tipo_reinicio?: string;
  fecha_inicio_temporada?: string;
  fecha_fin_temporada?: string;
  puntos_completado_meta?: number;
  nombre_sello: string;
  imagen_sello?: string;
  color_sello: string;
  sellos_obtenidos: number;
  total_sellos_especiales?: number;
  total_sellos_historico?: number;
  sellos_detalle: SelloDetalle[];
  catalogo_sellos_local?: DisenoSelloLocal[];
  es_activo_entrega?: boolean;
  mes_asignado?: string | null;
  temporada_nombre?: string | null;
}

export const MisSellosPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [localesSellos, setLocalesSellos] = useState<EstablecimientoSellos[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "con_sellos" | "por_visitar">("todos");
  const [ordenFecha, setOrdenFecha] = useState<"recientes" | "antiguos" | "sellos">("recientes");
  const [modoVisualizacion, setModoVisualizacion] = useState<"libro" | "lista">("libro");

  // Estado de la página actual del libro:
  // 0 = Portada oficial del Pasaporte
  // 1..N = Página del establecimiento
  // N+1 = Contraportada final del Pasaporte
  const [paginaActualLibro, setPaginaActualLibro] = useState(0);
  const [animacionDireccion, setAnimacionDireccion] = useState<"next" | "prev" | "none">("none");

  const cambiarPagina = (nuevaPagina: number, dir: "next" | "prev") => {
    setAnimacionDireccion(dir);
    setPaginaActualLibro(nuevaPagina);
  };

  const [ocultarFechas, setOcultarFechas] = useState(
    () => localStorage.getItem("pd_ocultar_fechas_sellos") === "1"
  );
  const [selloDetalle, setSelloDetalle] = useState<{
    sello: SelloDetalle;
    local?: EstablecimientoSellos;
  } | null>(null);

  // Modal para compartir tarjeta visual (captura/canvas)
  const [shareData, setShareData] = useState<StampShareData | null>(null);
  const [openShareModal, setOpenShareModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/activity/mis-sellos");
        if (!cancelled) setLocalesSellos(res.data?.data || []);
      } catch (err) {
        console.error("Error al cargar sellos", err);
        if (!cancelled) setLocalesSellos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleOcultar = async () => {
    const next = !ocultarFechas;
    setOcultarFechas(next);
    localStorage.setItem("pd_ocultar_fechas_sellos", next ? "1" : "0");
    try {
      await api.patch("/auth/preferencias", { ocultar_fechas_sellos: next ? 1 : 0 });
    } catch {
      /* fallback */
    }
  };

  // Categorías disponibles con conteo global
  const categoriasDisponibles = useMemo(() => {
    const map = new Map<string, { nombre: string; count: number; icono?: string }>();
    localesSellos.forEach((l) => {
      const cat = l.categoria_nombre || "General";
      const existing = map.get(cat);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(cat, { nombre: cat, count: 1, icono: l.categoria_icono });
      }
    });

    return {
      todasCount: localesSellos.length,
      categorias: Array.from(map.values()),
    };
  }, [localesSellos]);

  // Lista de establecimientos filtrados y ordenados (INCLUYE TODOS LOS LOCALES)
  const conSellos = useMemo(() => {
    let filtrados = localesSellos.filter((l) => {
      if (categoriaSeleccionada !== "Todas" && l.categoria_nombre !== categoriaSeleccionada) {
        return false;
      }
      if (filtroEstado === "con_sellos" && (l.sellos_obtenidos || 0) <= 0) {
        return false;
      }
      if (filtroEstado === "por_visitar" && (l.sellos_obtenidos || 0) > 0) {
        return false;
      }
      return true;
    });

    return [...filtrados].sort((a, b) => {
      const sellosA = a.sellos_obtenidos || 0;
      const sellosB = b.sellos_obtenidos || 0;

      // Por defecto, priorizar establecimientos con sellos sobre los que no tienen
      if (ordenFecha === "sellos") {
        return sellosB - sellosA;
      }

      if (sellosA > 0 && sellosB === 0) return -1;
      if (sellosA === 0 && sellosB > 0) return 1;

      const lastA = a.sellos_detalle?.[a.sellos_detalle.length - 1]?.fecha_otorgamiento || "";
      const lastB = b.sellos_detalle?.[b.sellos_detalle.length - 1]?.fecha_otorgamiento || "";

      if (ordenFecha === "recientes") {
        if (!lastA && !lastB) return a.nombre_comercial.localeCompare(b.nombre_comercial);
        return new Date(lastB).getTime() - new Date(lastA).getTime();
      }
      if (ordenFecha === "antiguos") {
        if (!lastA && !lastB) return a.nombre_comercial.localeCompare(b.nombre_comercial);
        return new Date(lastA).getTime() - new Date(lastB).getTime();
      }
      return 0;
    });
  }, [localesSellos, categoriaSeleccionada, filtroEstado, ordenFecha]);

  // Asegurar página válida en el libro si cambia la lista (máximo conSellos.length + 1 para la contraportada)
  useEffect(() => {
    if (paginaActualLibro > conSellos.length + 1) {
      setPaginaActualLibro(0);
    }
  }, [conSellos.length, paginaActualLibro]);

  // Métricas totales
  const totalSellos = useMemo(
    () => localesSellos.reduce((a, l) => a + (l.sellos_obtenidos || 0), 0),
    [localesSellos]
  );

  const localesConSellosCount = useMemo(
    () => localesSellos.filter((l) => (l.sellos_obtenidos || 0) > 0).length,
    [localesSellos]
  );

  const metasCompletadas = useMemo(
    () => localesSellos.filter((l) => (l.sellos_obtenidos || 0) >= (l.meta_sellos || 5)).length,
    [localesSellos]
  );

  const compartirLocal = (item: EstablecimientoSellos) => {
    setShareData({
      nombreEstablecimiento: item.nombre_comercial,
      categoria: item.categoria_nombre,
      sellosObtenidos: item.sellos_obtenidos || 0,
      metaSellos: item.meta_sellos || 5,
      colorSello: item.color_sello || "#7C0A1E",
      nombreSello: item.nombre_sello || `Sello ${item.nombre_comercial}`,
      imagenSello: item.imagen_sello,
      nombreUsuario: user ? `${user.nombres} ${user.apellidos || ""}`.trim() : "Explorador de Pasaporte",
      codigoCliente: (user as any)?.codigo_cliente || undefined,
      puntosDisponibles: (user as any)?.puntos_globales || (user as any)?.puntos_totales || (item.sellos_obtenidos ? item.sellos_obtenidos * 20 : 100),
      bonoMetaPuntos: Number(item.puntos_completado_meta) || 50,
      qrValue: typeof window !== "undefined" ? `${window.location.origin}/explorar` : undefined,
    });
    setOpenShareModal(true);
  };

  const localActual = paginaActualLibro > 0 ? conSellos[paginaActualLibro - 1] : null;

  // Cuadrícula responsive de acuerdo a meta_sellos (1 a 28)
  const getGridColsClass = (meta: number) => {
    if (meta <= 2) return "grid-cols-2 max-w-[240px] mx-auto";
    if (meta <= 4) return "grid-cols-2 sm:grid-cols-4";
    if (meta <= 6) return "grid-cols-3";
    if (meta <= 8) return "grid-cols-4";
    if (meta <= 12) return "grid-cols-4";
    if (meta <= 16) return "grid-cols-4";
    if (meta <= 20) return "grid-cols-5";
    return "grid-cols-5 sm:grid-cols-7";
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col pb-16">
      {/* Barra superior formal */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5DACD] px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/user/home"
              aria-label="Volver al inicio"
              className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E5DACD] flex items-center justify-center text-[#2D1A1E] hover:bg-[#F2ECE4] active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#2D1A1E] leading-tight">{t("myStamps") || "Mis Sellos"}</h1>
              <p className="text-[11px] text-[#6E5D53]">
                {totalSellos === 1 ? "1 sello registrado" : `${totalSellos} sellos registrados`} ·{" "}
                {localesConSellosCount} de {localesSellos.length} visitados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle de fecha */}
            <button
              type="button"
              onClick={toggleOcultar}
              title={ocultarFechas ? "Mostrar fechas" : "Ocultar fechas"}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5DACD] text-xs font-semibold text-[#7C0A1E] hover:bg-[#F2ECE4] active:scale-95 transition-all flex items-center gap-1"
            >
              {ocultarFechas ? <EyeOff size={15} /> : <Eye size={15} />}
              <span className="hidden sm:inline">
                {ocultarFechas ? "Ocultas" : "Fechas"}
              </span>
            </button>

            {/* Alternar vista: Libro vs Lista */}
            <div className="flex items-center bg-[#FAF8F5] border border-[#E5DACD] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setModoVisualizacion("libro")}
                title="Modo Libro Pasaporte"
                className={`p-1.5 rounded-lg transition-all ${
                  modoVisualizacion === "libro"
                    ? "bg-white text-[#7C0A1E] shadow-xs font-bold"
                    : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                }`}
              >
                <BookMarked size={15} />
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacion("lista")}
                title="Modo Lista Formal"
                className={`p-1.5 rounded-lg transition-all ${
                  modoVisualizacion === "lista"
                    ? "bg-white text-[#7C0A1E] shadow-xs font-bold"
                    : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                }`}
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto w-full px-4 pt-3 flex-1">
        {/* Banner formal optimizado (sin bloque pesado de validación) */}
        <div className="bg-gradient-to-r from-[#7C0A1E] to-[#5A0716] rounded-2xl p-3.5 text-white shadow-xs mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Logo de sello con fondo blanco */}
            <div className="w-10 h-10 rounded-xl bg-white text-[#7C0A1E] shadow-sm flex items-center justify-center shrink-0">
              <Stamp size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#E8D3A2] block">
                Pasaporte Digital Oficial
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                {totalSellos} {totalSellos === 1 ? "Sello Certificado" : "Sellos Certificados"}
              </h2>
            </div>
          </div>

          {/* Insignia de Metas con fondo blanco */}
          <div className="bg-white rounded-xl px-3 py-1 shadow-xs border border-white/20 text-center shrink-0">
            <span className="text-[8.5px] uppercase tracking-wider text-[#6E5D53] block font-bold">
              Metas
            </span>
            <span className="text-xs font-black text-[#7C0A1E]">
              {metasCompletadas} completadas
            </span>
          </div>
        </div>

        {/* Filtros lado a lado (al lado y no debajo) */}
        <div className="bg-white rounded-2xl border border-[#E5DACD] p-2.5 shadow-xs mb-3 flex items-center gap-2">
          {/* Combo box de Categoría */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#7C0A1E]">
              <Filter size={13} />
            </div>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value);
                setPaginaActualLibro(0);
              }}
              className="w-full bg-[#FAF8F5] border border-[#E5DACD] text-[#2D1A1E] text-xs font-semibold rounded-xl pl-7 pr-6 py-2 appearance-none focus:outline-none focus:border-[#7C0A1E] transition-all cursor-pointer truncate"
            >
              <option value="Todas">
                Categorías ({categoriasDisponibles.todasCount})
              </option>
              {categoriasDisponibles.categorias.map((cat) => (
                <option key={cat.nombre} value={cat.nombre}>
                  {cat.nombre} ({cat.count})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#8E7D7D]">
              <ChevronRight size={13} className="rotate-90" />
            </div>
          </div>

          {/* Combo box de Estado: Todos / Con Sellos / Por Visitar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#7C0A1E]">
              <Compass size={13} />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value as "todos" | "con_sellos" | "por_visitar");
                setPaginaActualLibro(0);
              }}
              className="w-full bg-[#FAF8F5] border border-[#E5DACD] text-[#2D1A1E] text-xs font-semibold rounded-xl pl-7 pr-6 py-2 appearance-none focus:outline-none focus:border-[#7C0A1E] transition-all cursor-pointer truncate"
            >
              <option value="todos">Todos los locales ({localesSellos.length})</option>
              <option value="con_sellos">Con sellos ({localesConSellosCount})</option>
              <option value="por_visitar">
                Por descubrir ({localesSellos.length - localesConSellosCount})
              </option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#8E7D7D]">
              <ChevronRight size={13} className="rotate-90" />
            </div>
          </div>

          {/* Combo box de Orden */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#7C0A1E]">
              <ArrowUpDown size={13} />
            </div>
            <select
              value={ordenFecha}
              onChange={(e) => {
                setOrdenFecha(e.target.value as "recientes" | "antiguos" | "sellos");
                setPaginaActualLibro(0);
              }}
              className="w-full bg-[#FAF8F5] border border-[#E5DACD] text-[#2D1A1E] text-xs font-semibold rounded-xl pl-7 pr-6 py-2 appearance-none focus:outline-none focus:border-[#7C0A1E] transition-all cursor-pointer truncate"
            >
              <option value="recientes">Recientes</option>
              <option value="antiguos">Antiguos</option>
              <option value="sellos">Más sellos</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#8E7D7D]">
              <ChevronRight size={13} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Estados: Cargando / Vacío / Presentación */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5DACD] shadow-xs">
            <div className="w-8 h-8 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#6E5D53] font-medium mt-3">Cargando libro de sellos...</p>
          </div>
        ) : conSellos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E5DACD] text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E5DACD] text-[#7C0A1E] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Stamp size={24} />
            </div>
            <h3 className="text-base font-bold text-[#2D1A1E]">No se encontraron locales</h3>
            <p className="text-xs text-[#6E5D53] mt-1 max-w-sm mx-auto">
              Prueba cambiando los filtros seleccionados o explora nuevos establecimientos afiliados.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setCategoriaSeleccionada("Todas");
                  setFiltroEstado("todos");
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5DACD] text-xs font-semibold text-[#2D1A1E] hover:bg-[#F2ECE4]"
              >
                Limpiar filtros
              </button>
              <Link
                to="/user/locales"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold shadow-xs hover:bg-[#650818]"
              >
                <Store size={14} /> Explorar locales
              </Link>
            </div>
          </div>
        ) : modoVisualizacion === "libro" ? (
          /* =========================================================================
             EXPERIENCIA PASAPORTE / LIBRO REAL DE SELLOS CON HOJAS PASABLES
             ========================================================================= */
          <div className="relative">
            {/* Lomo y contenedor exterior del libro */}
            <div className="bg-[#48050E] rounded-3xl p-1.5 shadow-xl border border-[#C5A059]/40 relative overflow-hidden">
              {/* Costura / relieve lateral del lomo de la libreta */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none z-20" />
              <div className="absolute left-2.5 top-0 bottom-0 w-[1px] border-r border-dashed border-[#C5A059]/40 pointer-events-none z-20" />

              {paginaActualLibro === 0 && (
                <div
                  key={`portada-${paginaActualLibro}-${animacionDireccion}`}
                  className={`bg-gradient-to-b from-[#4A040E] via-[#350209] to-[#1E0105] text-white rounded-2xl p-6 sm:p-8 min-h-[580px] sm:min-h-[640px] flex flex-col items-center justify-between text-center border-2 border-[#C5A059]/60 relative overflow-hidden shadow-2xl ${
                    animacionDireccion === "prev" ? "animate-pageFlipPrev" : animacionDireccion === "next" ? "animate-pageFlipNext" : ""
                  }`}
                >
                  {/* Cintas diagonales doradas en esquinas (Estilo Pasaporte Oficial) */}
                  <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden pointer-events-none z-20">
                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-gradient-to-br from-[#8C6826] via-[#F3E2B8] to-[#C5A059] rotate-45 transform origin-bottom-right shadow-md border-b border-[#FFF0D4]/60" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 overflow-hidden pointer-events-none z-20">
                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-tl from-[#8C6826] via-[#F3E2B8] to-[#C5A059] rotate-45 transform origin-top-left shadow-md border-t border-[#FFF0D4]/60" />
                  </div>

                  {/* Doble marco ornamental interior dorado */}
                  <div className="absolute inset-2.5 rounded-xl border border-[#C5A059]/50 pointer-events-none" />
                  <div className="absolute inset-4 rounded-lg border border-[#C5A059]/20 pointer-events-none" />

                  {/* Top: Lema de viaje */}
                  <div className="relative z-10 pt-2 flex flex-col items-center w-full">
                    <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase font-bold text-[#E8D3A2] opacity-90 block">
                      EXPLORA · VISITA · COLECCIONA
                    </span>

                    {/* Título Principal Dorado Embozado */}
                    <div className="flex flex-col items-center mt-6 sm:mt-8">
                      <span className="font-serif text-xs sm:text-sm tracking-[0.3em] uppercase text-[#E8D3A2] font-semibold">
                        PASAPORTE
                      </span>
                      <h1 className="font-serif text-4xl sm:text-5xl tracking-widest font-black bg-gradient-to-b from-[#FFF5DB] via-[#E8D3A2] to-[#B38539] bg-clip-text text-transparent drop-shadow-md my-0.5">
                        DIGITAL
                      </h1>
                      
                      {/* Línea divisoria con diamante dorado */}
                      <div className="flex items-center justify-center gap-2.5 my-2.5 w-full max-w-[210px]">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A059] to-[#C5A059]" />
                        <span className="text-[#C5A059] text-[10px]">◆</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A059] to-[#C5A059]" />
                      </div>

                      <span className="text-[9.5px] sm:text-[10.5px] font-medium tracking-[0.22em] uppercase text-[#E8D3A2]/80 block">
                        REGISTRO OFICIAL DE SELLOS Y VISITAS
                      </span>
                    </div>
                  </div>

                  {/* Centro: Ilustración Vectorial de Monumentos y Patrimonio en Líneas Doradas */}
                  <div className="relative z-10 my-auto py-2 flex flex-col items-center w-full">
                    <svg
                      viewBox="0 0 360 140"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full max-w-[290px] sm:max-w-[330px] h-auto text-[#E8D3A2] drop-shadow-sm"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Líneas de suelo */}
                      <line x1="20" y1="130" x2="340" y2="130" strokeWidth="1.5" />
                      <line x1="10" y1="133" x2="350" y2="133" strokeWidth="0.8" opacity="0.6" />

                      {/* 1. Faro / Torre histórica izquierda */}
                      <path d="M 52 130 L 56 60 L 74 60 L 78 130 Z" strokeWidth="1.2" />
                      <path d="M 53 100 L 77 100" strokeWidth="0.9" />
                      <path d="M 54 80 L 76 80" strokeWidth="0.9" />
                      <path d="M 63 70 L 67 70 L 67 78 L 63 78 Z" strokeWidth="0.8" />
                      <path d="M 63 88 L 67 88 L 67 96 L 63 96 Z" strokeWidth="0.8" />
                      <path d="M 63 106 L 67 106 L 67 116 L 63 116 Z" strokeWidth="0.8" />
                      <path d="M 50 60 L 80 60 L 78 52 L 52 52 Z" strokeWidth="1.2" />
                      <path d="M 57 52 L 57 42 L 73 42 L 73 52" strokeWidth="1.2" />
                      <line x1="65" y1="42" x2="65" y2="52" strokeWidth="0.8" />
                      <path d="M 55 42 Q 65 30 75 42 Z" strokeWidth="1.2" />
                      <line x1="65" y1="30" x2="65" y2="24" strokeWidth="1" />
                      <circle cx="65" cy="23" r="1.5" fill="currentColor" />

                      {/* 2. Catedral Central */}
                      {/* Campanario izquierdo */}
                      <rect x="110" y="55" width="24" height="75" strokeWidth="1.2" />
                      <path d="M 110 55 L 122 40 L 134 55 Z" strokeWidth="1.2" />
                      <path d="M 117 70 C 117 65 127 65 127 70 L 127 88 C 127 88 117 88 117 88 Z" strokeWidth="0.9" />
                      <path d="M 118 100 C 118 97 126 97 126 100 L 126 118 L 118 118 Z" strokeWidth="0.8" />
                      <circle cx="122" cy="38" r="1.5" fill="currentColor" />
                      <line x1="122" y1="38" x2="122" y2="34" strokeWidth="1" />

                      {/* Campanario derecho */}
                      <rect x="216" y="55" width="24" height="75" strokeWidth="1.2" />
                      <path d="M 216 55 L 228 40 L 240 55 Z" strokeWidth="1.2" />
                      <path d="M 223 70 C 223 65 233 65 233 70 L 233 88 C 233 88 223 88 223 88 Z" strokeWidth="0.9" />
                      <path d="M 224 100 C 224 97 232 97 232 100 L 232 118 L 224 118 Z" strokeWidth="0.8" />
                      <circle cx="228" cy="38" r="1.5" fill="currentColor" />
                      <line x1="228" y1="38" x2="228" y2="34" strokeWidth="1" />

                      {/* Fachada de la catedral */}
                      <rect x="134" y="70" width="82" height="60" strokeWidth="1.2" />
                      <path d="M 134 70 L 175 48 L 216 70 Z" strokeWidth="1.4" />
                      <line x1="175" y1="48" x2="175" y2="34" strokeWidth="1.5" />
                      <line x1="170" y1="40" x2="180" y2="40" strokeWidth="1.5" />
                      <path d="M 160 130 L 160 102 C 160 92 190 92 190 102 L 190 130 Z" strokeWidth="1.3" />
                      <path d="M 165 130 L 165 106 C 165 98 185 98 185 106 L 185 130 Z" strokeWidth="0.8" />
                      <path d="M 154 82 C 154 78 160 78 160 82 L 160 92 L 154 92 Z" strokeWidth="0.8" />
                      <path d="M 172 78 C 172 74 178 74 178 78 L 178 92 L 172 92 Z" strokeWidth="0.8" />
                      <path d="M 190 82 C 190 78 196 78 196 82 L 196 92 L 190 92 Z" strokeWidth="0.8" />

                      {/* 3. Casona y Arquería colonial derecha */}
                      <rect x="245" y="90" width="48" height="40" strokeWidth="1.2" />
                      <path d="M 243 90 L 269 76 L 295 90 Z" strokeWidth="1" />
                      <circle cx="269" cy="84" r="3" strokeWidth="0.8" />
                      <path d="M 251 130 L 251 110 C 251 106 259 106 259 110 L 259 130 Z" strokeWidth="0.8" />
                      <path d="M 265 130 L 265 110 C 265 106 273 106 273 110 L 273 130 Z" strokeWidth="0.8" />
                      <path d="M 279 130 L 279 110 C 279 106 287 106 287 110 L 287 130 Z" strokeWidth="0.8" />

                      {/* 4. Palmera tradicional */}
                      <path d="M 312 130 C 311 110 316 95 319 82" strokeWidth="1.4" />
                      <path d="M 319 82 C 314 74 300 76 294 82" strokeWidth="1.2" />
                      <path d="M 319 82 C 315 68 305 66 298 72" strokeWidth="1.2" />
                      <path d="M 319 82 C 319 66 317 60 315 58" strokeWidth="1.2" />
                      <path d="M 319 82 C 322 66 327 60 332 62" strokeWidth="1.2" />
                      <path d="M 319 82 C 328 70 336 74 340 80" strokeWidth="1.2" />
                      <path d="M 319 82 C 328 80 338 88 336 94" strokeWidth="1.2" />
                    </svg>

                    {/* Divisor inferior con diamante */}
                    <div className="flex items-center justify-center gap-2.5 mt-3 w-full max-w-[170px]">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A059] to-[#C5A059]" />
                      <span className="text-[#C5A059] text-[10px]">◆</span>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A059] to-[#C5A059]" />
                    </div>

                    {/* Badge contador de sellos del viajero */}
                    <div className="bg-black/35 backdrop-blur-xs border border-[#C5A059]/40 rounded-full py-1 px-3.5 inline-flex items-center gap-2 shadow-inner mt-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E5C384] animate-pulse" />
                      <span className="text-[9.5px] font-bold tracking-wider uppercase text-[#E8D3A2]">
                        {totalSellos} {totalSellos === 1 ? "sello certificado" : "sellos certificados"}
                      </span>
                    </div>
                  </div>

                  {/* Botón: Abrir Pasaporte */}
                  <div className="relative z-10 w-full pt-2 pb-1">
                    <button
                      type="button"
                      onClick={() => cambiarPagina(1, "next")}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B88934] via-[#F3E2B8] to-[#B88934] text-[#3B030B] text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#FFF0D4]/40 cursor-pointer"
                    >
                      <BookOpen size={16} className="text-[#3B030B]" />
                      <span>Abrir Pasaporte</span>
                      <ChevronRight size={16} className="text-[#3B030B]" />
                    </button>
                  </div>
                </div>
              )}

              {paginaActualLibro > conSellos.length && (
                <div
                  key={`contraportada-${paginaActualLibro}-${animacionDireccion}`}
                  className={`bg-gradient-to-b from-[#4A040E] via-[#350209] to-[#1E0105] text-white rounded-2xl p-6 sm:p-8 min-h-[580px] sm:min-h-[640px] flex flex-col items-center justify-between text-center border-2 border-[#C5A059]/60 relative overflow-hidden shadow-2xl ${
                    animacionDireccion === "next" ? "animate-pageFlipNext" : animacionDireccion === "prev" ? "animate-pageFlipPrev" : ""
                  }`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden pointer-events-none z-20">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-bl from-[#8C6826] via-[#F3E2B8] to-[#C5A059] rotate-45 transform origin-bottom-left shadow-md border-b border-[#FFF0D4]/60" />
                  </div>
                  <div className="absolute inset-2.5 rounded-xl border border-[#C5A059]/50 pointer-events-none" />
                  <div className="absolute inset-4 rounded-lg border border-[#C5A059]/20 pointer-events-none" />

                  <div className="relative z-10 pt-4 flex flex-col items-center">
                    <span className="text-[11px] tracking-[0.3em] uppercase font-black text-[#E8D3A2] block">
                      PASAPORTE DIGITAL
                    </span>
                    <span className="text-[9.5px] tracking-[0.2em] uppercase text-[#E8D3A2]/80 block mt-1 mb-2">
                      Contraportada Oficial
                    </span>
                    <div className="bg-black/30 backdrop-blur-xs border border-[#C5A059]/40 rounded-full py-1 px-3 mt-1 inline-block shadow-sm">
                      <span className="text-[9.5px] font-bold text-[#E8D3A2] uppercase tracking-wider">
                        Fin del Cuadernillo
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 my-4 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full border-2 border-[#C5A059] bg-[#45040E] flex flex-col items-center justify-center p-2 shadow-inner shadow-black/60 relative">
                      <div className="absolute inset-1.5 rounded-full border border-dashed border-[#C5A059]/60" />
                      <Stamp size={42} className="text-[#E8D3A2]" strokeWidth={1.8} />
                      <span className="text-[8.5px] uppercase font-black tracking-widest text-[#E8D3A2] mt-1.5">
                        Certificado
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 w-full pb-1">
                    <button
                      type="button"
                      onClick={() => cambiarPagina(0, "next")}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B88934] via-[#F3E2B8] to-[#B88934] text-[#3B030B] text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#FFF0D4]/40 cursor-pointer"
                    >
                      <BookOpen size={16} />
                      <span>Volver a la Portada</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {paginaActualLibro > 0 && paginaActualLibro <= conSellos.length && localActual && (
                  <div
                    key={`page-${paginaActualLibro}-${animacionDireccion}`}
                    className={`bg-[#FCFBF7] text-[#2D1A1E] rounded-2xl p-4 sm:p-5 min-h-[580px] sm:min-h-[640px] flex flex-col justify-between border border-[#E5DACD] relative overflow-hidden shadow-inner ${
                      animacionDireccion === "next"
                        ? "animate-pageFlipNext"
                        : animacionDireccion === "prev"
                        ? "animate-pageFlipPrev"
                        : ""
                    }`}
                  >
                    {/* Filigrana guilloche sutil de seguridad en fondo */}
                    <div className="absolute inset-0 bg-[radial-gradient(#EFE7DE_1px,transparent_1px)] [background-size:14px_14px] opacity-70 pointer-events-none" />

                    {/* Cabecera formal de la hoja de pasaporte */}
                    <div className="relative z-10 border-b border-[#E5DACD] pb-3">
                      <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-[#8E7D7D] uppercase">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>Visas & Sellos</span>
                          {localActual.tipo_reinicio === "MENSUAL" && (
                            <span className="text-[8px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded-md font-bold">
                              Ciclo Mensual
                            </span>
                          )}
                          {localActual.tipo_reinicio === "TEMPORADA" && (
                            <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-md font-bold">
                              Temporada {localActual.fecha_inicio_temporada ? new Date(localActual.fecha_inicio_temporada).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }) : ""} - {localActual.fecha_fin_temporada ? new Date(localActual.fecha_fin_temporada).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }) : ""}
                            </span>
                          )}
                          {localActual.tipo_reinicio === "CICLICO" && (
                            <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-md font-bold">
                              Continuo
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-[#7C0A1E]">
                          Pág. {String(paginaActualLibro).padStart(2, "0")} / {String(conSellos.length).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Info del establecimiento */}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              localActual.logo ||
                              "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80"
                            }
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-[#E5DACD] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-[#2D1A1E] leading-tight truncate">
                                {localActual.nombre_comercial}
                              </h3>
                              {localActual.sellos_obtenidos === 0 && (
                                <span className="text-[9px] font-bold text-[#8E7D7D] bg-[#FAF8F5] border border-[#E5DACD] px-1.5 py-0.2 rounded-full shrink-0">
                                  Por descubrir
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8E7D7D] font-medium block truncate">
                              {localActual.categoria_nombre || "Local Afiliado"}
                            </span>
                          </div>
                        </div>

                        {/* Contador de sellos en la hoja */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs border ${
                              localActual.sellos_obtenidos >= (localActual.meta_sellos || 5)
                                ? "text-amber-800 bg-amber-50 border-amber-300"
                                : localActual.sellos_obtenidos > 0
                                ? "text-[#7C0A1E] bg-white border-[#E5DACD]"
                                : "text-[#8E7D7D] bg-[#FAF8F5] border-[#E5DACD]"
                            }`}
                          >
                            {localActual.sellos_obtenidos} / {localActual.meta_sellos || 5} sellos
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso de la meta */}
                      <div className="w-full bg-[#EFE7DE] rounded-full h-1.5 overflow-hidden mt-2.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (localActual.sellos_obtenidos / (localActual.meta_sellos || 5)) * 100
                              )
                            )}%`,
                            backgroundColor:
                              localActual.sellos_obtenidos >= (localActual.meta_sellos || 5)
                                ? "#D97706"
                                : localActual.color_sello || "#7C0A1E",
                          }}
                        />
                      </div>

                      {/* Celebración de meta lograda o recordatorio de bono */}
                      {localActual.sellos_obtenidos >= (localActual.meta_sellos || 5) ? (
                        <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-amber-200 border border-amber-400 flex items-center justify-center text-amber-800 shrink-0">
                              <Award size={15} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black leading-tight text-[#92400E]">
                                ¡Cartilla Completada!
                              </p>
                              <p className="text-[9.5px] text-amber-900 leading-tight">
                                Ganaste +{localActual.puntos_completado_meta || 50} pts de bono y Sello Dorado
                              </p>
                            </div>
                          </div>
                          <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-400 shrink-0">
                            Meta Lograda
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[10px] text-[#8E7D7D] mt-1.5">
                          <span>
                            Meta: <strong>{localActual.meta_sellos || 5} sellos</strong>
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Bono por completar: +{localActual.puntos_completado_meta || 50} pts
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CUADRÍCULA DE LA CARTILLA DE SELLOS DEL LOCAL */}
                    <div className="relative z-10 py-3 flex-1 flex flex-col justify-center">
                      {(() => {
                        const totalSlots = Math.max(1, Math.min(28, Number(localActual.meta_sellos) || 5));
                        const slots = Array.from({ length: totalSlots }).map((_, idx) => {
                          const selloDet = localActual.sellos_detalle?.[idx] || null;
                          const isFilled = idx < (localActual.sellos_obtenidos || 0) || Boolean(selloDet);
                          const isMetaSlot = idx === totalSlots - 1;
                          const esEspecial = Boolean(selloDet?.es_sello_especial || (isFilled && isMetaSlot));

                          const disenoCatalogo = localActual.catalogo_sellos_local?.[idx] || null;
                          const nombreSello = selloDet?.nombre_sello || disenoCatalogo?.nombre_sello || localActual.nombre_sello || `Sello #${idx + 1}`;
                          const imagenSello = selloDet?.imagen_sello_url || disenoCatalogo?.imagen_sello || localActual.imagen_sello || "coffee";
                          const colorSello = selloDet?.color_sello || disenoCatalogo?.color_sello || localActual.color_sello || "#7C0A1E";
                          const fechaGanado = selloDet?.fecha_otorgamiento || null;

                          return {
                            idx,
                            numero: idx + 1,
                            isFilled,
                            isMetaSlot,
                            esEspecial,
                            nombreSello,
                            imagenSello,
                            colorSello,
                            fechaGanado,
                            selloDet: selloDet || {
                              id_sello: idx + 1,
                              numero_sello: idx + 1,
                              fecha_otorgamiento: fechaGanado || new Date().toISOString(),
                              es_sello_especial: esEspecial,
                              nombre_sello: nombreSello,
                              color_sello: colorSello,
                            },
                          };
                        });

                        return (
                          <div className={`grid gap-2.5 ${getGridColsClass(totalSlots)}`}>
                            {slots.map((item) => {
                              const StampIconComp = getStampIcon(item.imagenSello);
                              const isImg = isImageUrl(item.imagenSello);
                              const imgUrl = resolveImageUrl(item.imagenSello);

                              if (!item.isFilled) {
                                return (
                                  <div
                                    key={`slot-empty-${item.numero}`}
                                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 text-center select-none relative transition-all ${
                                      item.isMetaSlot
                                        ? "border-dashed border-amber-400 bg-amber-50/50 text-amber-900"
                                        : "border-dashed border-[#DCD3C7] bg-[#F7F4EE]/50 text-[#A8988B]"
                                    }`}
                                    title={item.isMetaSlot ? `Meta: Bono de +${localActual.puntos_completado_meta || 50} pts` : `Visita #${item.numero} pendiente`}
                                  >
                                    <div
                                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-dashed flex flex-col items-center justify-center mb-0.5 opacity-60 ${
                                        item.isMetaSlot ? "border-amber-400 bg-amber-100/40 text-amber-700" : "border-[#DCD3C7] text-[#A8988B]"
                                      }`}
                                    >
                                      {item.isMetaSlot ? (
                                        <Award className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={1.8} />
                                      ) : StampIconComp ? (
                                        <StampIconComp className="w-4 h-4 shrink-0 text-[#A8988B]" strokeWidth={1.5} />
                                      ) : (
                                        <CategoryIcon icon={localActual.imagen_sello || "coffee"} className="w-4 h-4 text-[#A8988B]" />
                                      )}
                                      <span className="text-[7.5px] font-bold mt-0.5">#{item.numero}</span>
                                    </div>

                                    <span className={`text-[7.5px] font-bold truncate max-w-full leading-tight ${
                                      item.isMetaSlot ? "text-amber-800" : "text-[#8E7D7D]"
                                    }`}>
                                      {item.isMetaSlot ? `+${localActual.puntos_completado_meta || 50} pts` : "Por visitar"}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={`slot-stamped-${item.numero}`}
                                  type="button"
                                  onClick={() =>
                                    setSelloDetalle({ sello: item.selloDet, local: localActual })
                                  }
                                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 text-center shadow-xs active:scale-95 transition-all relative group border ${
                                    item.esEspecial
                                      ? "bg-gradient-to-b from-amber-50 to-amber-100/70 border-amber-400 ring-2 ring-amber-400/20"
                                      : "bg-white border-[#E5DACD] hover:border-[#7C0A1E]"
                                  }`}
                                  title={item.esEspecial ? "Sello Dorado de Meta Cumplida" : `${item.nombreSello} (#${item.numero})`}
                                >
                                  {item.esEspecial && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow-xs">
                                      <Award size={10} strokeWidth={2.5} />
                                    </span>
                                  )}

                                  <div
                                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex flex-col items-center justify-center p-0.5 relative transition-transform group-hover:scale-105 ${
                                      item.esEspecial ? "border-amber-500 bg-amber-50/50" : "border-dashed bg-[#FAF8F5]/80"
                                    }`}
                                    style={{
                                      borderColor: item.esEspecial ? "#D97706" : item.colorSello,
                                      color: item.esEspecial ? "#B45309" : item.colorSello,
                                    }}
                                  >
                                    <div
                                      className="absolute inset-0.5 rounded-full border opacity-40 pointer-events-none"
                                      style={{ borderColor: item.esEspecial ? "#D97706" : item.colorSello }}
                                    />

                                    {StampIconComp ? (
                                      <StampIconComp className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" strokeWidth={2} />
                                    ) : isImg ? (
                                      <img
                                        src={imgUrl}
                                        alt=""
                                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-full"
                                      />
                                    ) : (
                                      <CategoryIcon icon={item.imagenSello || "coffee"} className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                    )}

                                    <span className="text-[7.5px] font-black leading-none mt-0.5">
                                      #{item.numero}
                                    </span>
                                  </div>

                                  <span className={`text-[7.5px] font-bold truncate max-w-full mt-1 leading-tight ${
                                    item.esEspecial ? "text-amber-900" : "text-[#2D1A1E]"
                                  }`}>
                                    {item.nombreSello}
                                  </span>

                                  {!ocultarFechas && item.fechaGanado && (
                                    <span className="text-[6.5px] text-[#8E7D7D] font-mono leading-tight mt-0.5 truncate max-w-full">
                                      {new Date(item.fechaGanado).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Mensaje motivacional o regla de visitas posteriores (SIN EMOJIS) */}
                      {localActual.sellos_obtenidos >= (localActual.meta_sellos || 5) ? (
                        <div className="mt-2 text-center bg-[#FAF8F5] border border-[#E5DACD] rounded-xl p-2 flex items-center justify-center gap-1.5 text-[10px] text-[#6E5D53]">
                          <Sparkles size={13} className="text-amber-600 shrink-0" />
                          <span>¡Completaste tu cartilla! Las siguientes visitas continúan acumulando puntos regulares por tu consumo.</span>
                        </div>
                      ) : localActual.sellos_obtenidos === 0 ? (
                        <div className="mt-3 text-center bg-[#FAF8F5] border border-[#E5DACD] rounded-xl p-2 flex items-center justify-center gap-1.5 text-[10.5px] text-[#6E5D53] font-medium">
                          <MapPin size={13} className="text-[#7C0A1E] shrink-0" />
                          <span>Aún no has visitado este local. ¡Acerca tu credencial NFC en tienda para conseguir tu primer sello!</span>
                        </div>
                      ) : null}
                    </div>

                    {/* REDES SOCIALES Y CONTACTO AL PIE DE LA HOJA */}
                    <div className="relative z-10 pt-2.5 border-t border-[#E5DACD] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* WhatsApp / Teléfono */}
                        {localActual.telefono && (
                          <a
                            href={`https://wa.me/${localActual.telefono.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 text-[11px] font-bold flex items-center gap-1 hover:bg-[#25D366]/20 transition-all"
                            title="Contactar por WhatsApp"
                          >
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Google Maps / Ubicación */}
                        {(localActual.google_maps_url || localActual.direccion) && (
                          <a
                            href={
                              localActual.google_maps_url ||
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${localActual.nombre_comercial} ${localActual.direccion || ""}`
                              )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] text-[#2D1A1E] border border-[#E5DACD] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#F2ECE4] transition-all"
                            title="Ver en Google Maps"
                          >
                            <MapPin size={12} className="text-[#7C0A1E]" />
                            <span>Maps</span>
                          </a>
                        )}

                        {/* Compartir */}
                        <button
                          type="button"
                          onClick={() => compartirLocal(localActual)}
                          className="p-1.5 rounded-xl bg-[#FAF8F5] text-[#6E5D53] border border-[#E5DACD] hover:bg-[#F2ECE4] hover:text-[#2D1A1E] transition-all"
                          title="Compartir"
                        >
                          <Share2 size={13} />
                        </button>
                      </div>

                      {/* Botón Ver Local */}
                      <Link
                        to={`/user/locales/${localActual.id_establecimiento}`}
                        className="px-3 py-1.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#650818] active:scale-95 transition-all flex items-center gap-1 shadow-xs ml-auto"
                      >
                        <span>Ver local</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
              )}
            </div>

            {/* CONTROLES PARA PASAR PÁGINAS DEL LIBRO (Siguiente / Anterior / Portada / Contraportada) */}
            <div className="mt-3 flex items-center justify-between bg-white rounded-2xl border border-[#E5DACD] p-2 shadow-xs">
              <button
                type="button"
                onClick={() => cambiarPagina(Math.max(0, paginaActualLibro - 1), "prev")}
                className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5DACD] text-xs font-semibold text-[#2D1A1E] hover:bg-[#F2ECE4] active:scale-95 transition-all flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                <span>
                  {paginaActualLibro === 1
                    ? "Portada"
                    : paginaActualLibro > conSellos.length
                    ? "Última Hoja"
                    : "Anterior"}
                </span>
              </button>

              {/* Indicador de página, portada o contraportada */}
              <div className="text-center min-w-0 px-2">
                <span className="text-[11px] font-bold text-[#2D1A1E] block truncate">
                  {paginaActualLibro === 0
                    ? "Portada del Pasaporte"
                    : paginaActualLibro > conSellos.length
                    ? "Contraportada"
                    : `Pág. ${paginaActualLibro} de ${conSellos.length}`}
                </span>
                <span className="text-[9px] text-[#8E7D7D] font-mono block truncate">
                  {paginaActualLibro === 0
                    ? `${conSellos.length} locales en tu libro`
                    : paginaActualLibro > conSellos.length
                    ? "Cierre del pasaporte"
                    : localActual?.nombre_comercial}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (paginaActualLibro > conSellos.length) {
                    cambiarPagina(0, "next");
                  } else {
                    cambiarPagina(paginaActualLibro + 1, "next");
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5DACD] text-xs font-semibold text-[#2D1A1E] hover:bg-[#F2ECE4] active:scale-95 transition-all flex items-center gap-1"
              >
                <span>
                  {paginaActualLibro === conSellos.length
                    ? "Contraportada"
                    : paginaActualLibro > conSellos.length
                    ? "Portada"
                    : "Siguiente"}
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             VISTA LISTA FORMAL: Nombre del establecimiento, y debajo el sello con fecha/hora
             ========================================================================= */
          <div className="space-y-2.5">
            {conSellos.map((item, index) => {
              const lastStamp = item.sellos_detalle?.[item.sellos_detalle.length - 1];
              const color = item.color_sello || "#7C0A1E";

              const formattedDate = lastStamp?.fecha_otorgamiento
                ? new Date(lastStamp.fecha_otorgamiento).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : null;

              const formattedTime = lastStamp?.fecha_otorgamiento
                ? new Date(lastStamp.fecha_otorgamiento).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : null;

              return (
                <div
                  key={item.id_establecimiento}
                  className="bg-white rounded-2xl border border-[#E5DACD] p-3 shadow-xs hover:border-[#7C0A1E]/40 transition-all flex items-center justify-between gap-3"
                >
                  {/* Sello oficial + Nombre y fecha/hora debajo */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPaginaActualLibro(index + 1);
                        setModoVisualizacion("libro");
                      }}
                      className="cursor-pointer shrink-0 transition-transform active:scale-95"
                      title="Abrir hoja de este local en el libro"
                    >
                      <div
                        className="w-11 h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-0.5 relative shadow-xs bg-white"
                        style={{ borderColor: color, color }}
                      >
                        <div
                          className="absolute inset-0.5 rounded-full border opacity-50"
                          style={{ borderColor: color }}
                        />
                        <CategoryIcon
                          icon={item.imagen_sello || item.categoria_icono || "coffee"}
                          size={15}
                        />
                        <span className="text-[7.5px] font-black uppercase tracking-tight leading-none mt-0.5">
                          #{lastStamp?.numero_sello || item.sellos_obtenidos}
                        </span>
                      </div>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D1A1E] truncate block">
                          {item.nombre_comercial}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0 border ${
                            item.sellos_obtenidos > 0
                              ? "text-[#7C0A1E] bg-[#FAF8F5] border-[#E5DACD]"
                              : "text-[#8E7D7D] bg-gray-50 border-gray-200"
                          }`}
                        >
                          {item.sellos_obtenidos}/{item.meta_sellos}
                        </span>
                      </div>

                      {/* Debajo: Sello oficial con la fecha y la hora */}
                      <div className="text-[11px] text-[#6E5D53] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#2D1A1E]">
                          {item.nombre_sello || "Sello Oficial"}
                        </span>
                        <span className="text-[#C4B7AB]">·</span>
                        {item.sellos_obtenidos > 0 && !ocultarFechas && formattedDate ? (
                          <span className="font-mono text-[#8E7D7D] flex items-center gap-1">
                            <Clock size={11} className="text-[#A8988B]" />
                            {formattedDate} {formattedTime}
                          </span>
                        ) : item.sellos_obtenidos > 0 ? (
                          <span className="text-[10px] text-[#A8988B]">Registrado con NFC</span>
                        ) : (
                          <span className="text-[10px] text-[#C5A059] font-semibold">
                            Por descubrir · 0 sellos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones: botón de ver en el libro y compartir */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => compartirLocal(item)}
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#D5CFC7] text-[#6E5D53] hover:text-[#2D1A1E] hover:bg-[#F2ECE4] active:scale-95 transition-all shadow-xs"
                      title="Compartir tarjeta digital en WhatsApp"
                    >
                      <Share2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaginaActualLibro(index + 1);
                        setModoVisualizacion("libro");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#D5CFC7] text-[#2D1A1E] text-xs font-semibold hover:bg-[#F2ECE4] hover:border-[#7C0A1E]/40 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <BookOpen size={13} className="text-[#7C0A1E]" />
                      <span className="font-bold">Ver libro</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DETALLE DE SELLO INDIVIDUAL */}
      {selloDetalle && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl border border-[#E5DACD] relative">
            <button
              type="button"
              onClick={() => setSelloDetalle(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E5DACD] text-[#6E5D53] flex items-center justify-center hover:text-[#2D1A1E] transition-all"
            >
              <X size={15} />
            </button>

            {/* Sello Grande Notarial */}
            <div className="flex justify-center my-3">
              <DigitalStampBadge
                nombre_sello={selloDetalle.local?.nombre_sello || "Sello Oficial"}
                establecimiento_nombre={selloDetalle.local?.nombre_comercial || "Establecimiento"}
                imagen_sello={
                  selloDetalle.local?.imagen_sello ||
                  selloDetalle.local?.categoria_icono ||
                  "coffee"
                }
                color_sello={selloDetalle.local?.color_sello || "#7C0A1E"}
                numero_sello={selloDetalle.sello.numero_sello}
                fecha={!ocultarFechas ? selloDetalle.sello.fecha_otorgamiento : undefined}
                es_sello_especial={Boolean(
                  selloDetalle.sello.es_sello_especial ||
                  (selloDetalle.local && selloDetalle.sello.numero_sello >= (selloDetalle.local.meta_sellos || 5))
                )}
                size="md"
                rotation={-2}
              />
            </div>

            <div className="mt-3 space-y-1">
              <span className={`text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-1 ${
                selloDetalle.sello.es_sello_especial || (selloDetalle.local && selloDetalle.sello.numero_sello >= (selloDetalle.local.meta_sellos || 5))
                  ? "text-amber-800"
                  : "text-[#6E5D53]"
              }`}>
                {selloDetalle.sello.es_sello_especial || (selloDetalle.local && selloDetalle.sello.numero_sello >= (selloDetalle.local.meta_sellos || 5)) ? (
                  <>
                    <Award size={13} className="text-amber-600" />
                    <span>Sello Dorado de Meta Cumplida</span>
                  </>
                ) : (
                  <span>Sello Digital Certificado</span>
                )}
              </span>
              <h3 className="text-base font-bold text-[#2D1A1E]">
                {selloDetalle.local?.nombre_comercial || "Establecimiento"}
              </h3>
              <p className="text-xs font-semibold text-[#7C0A1E]">
                Sello #{selloDetalle.sello.numero_sello} de {selloDetalle.local?.meta_sellos || 5}
              </p>

              {selloDetalle.sello.periodo_referencia && (
                <p className="text-[10px] text-[#8E7D7D] font-mono">
                  Período: {selloDetalle.sello.periodo_referencia}
                </p>
              )}

              {!ocultarFechas && (
                <div className="mt-2 text-xs text-[#6E5D53] font-mono bg-[#FAF8F5] py-1.5 px-3 rounded-xl border border-[#E5DACD] inline-block">
                  {new Date(selloDetalle.sello.fecha_otorgamiento).toLocaleString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelloDetalle(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#650818] transition-all shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal para Compartir como Tarjeta Gráfica en WhatsApp / Redes */}
      <StampShareModal
        open={openShareModal}
        onClose={() => setOpenShareModal(false)}
        data={shareData}
      />
    </div>
  );
};
