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
} from "lucide-react";
import api from "../../services/api";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";
import { CategoryIcon } from "../../components/common/CategoryIcon";

interface SelloDetalle {
  id_sello: number;
  numero_sello: number;
  fecha_otorgamiento: string;
  es_festivo?: number;
  imagen_sello_url?: string;
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
  nombre_sello: string;
  imagen_sello?: string;
  color_sello: string;
  sellos_obtenidos: number;
  sellos_detalle: SelloDetalle[];
}

export const MisSellosPage: React.FC = () => {
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
    () => localesSellos.filter((l) => (l.sellos_obtenidos || 0) >= (l.meta_sellos || 10)).length,
    [localesSellos]
  );

  const compartirLocal = async (item: EstablecimientoSellos) => {
    const texto =
      item.sellos_obtenidos > 0
        ? `Tengo ${item.sellos_obtenidos}/${item.meta_sellos} sellos en ${item.nombre_comercial}. ¡Mi Pasaporte Digital!`
        : `¡Conoce ${item.nombre_comercial} en el Pasaporte Digital de Sellos!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pasaporte Digital", text: texto });
      } catch {
        /* cancel */
      }
    } else {
      await navigator.clipboard.writeText(texto);
      alert("Enlace copiado al portapapeles");
    }
  };

  const localActual = paginaActualLibro > 0 ? conSellos[paginaActualLibro - 1] : null;

  // Cuadrícula responsive de acuerdo a meta_sellos
  const getGridColsClass = (meta: number) => {
    if (meta <= 6) return "grid-cols-3";
    if (meta <= 8) return "grid-cols-4";
    if (meta <= 10) return "grid-cols-5";
    return "grid-cols-4 sm:grid-cols-6";
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
              <h1 className="text-lg font-bold text-[#2D1A1E] leading-tight">Mis Sellos</h1>
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
                  className={`bg-gradient-to-b from-[#6A0918] via-[#520510] to-[#3B030B] text-white rounded-2xl p-6 sm:p-8 min-h-[440px] flex flex-col items-center justify-between text-center border border-[#C5A059]/50 relative overflow-hidden ${
                    animacionDireccion === "prev" ? "animate-pageFlipPrev" : animacionDireccion === "next" ? "animate-pageFlipNext" : ""
                  }`}
                >
                  <div className="absolute inset-2.5 rounded-xl border border-[#C5A059]/40 pointer-events-none" />
                  <div className="absolute inset-3.5 rounded-lg border border-[#C5A059]/20 pointer-events-none" />

                  <div className="relative z-10 pt-2 flex flex-col items-center">
                    <span className="text-[11px] tracking-[0.25em] uppercase font-black text-[#E8D3A2] block">
                      PASAPORTE DIGITAL
                    </span>
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#E8D3A2]/80 block mt-0.5 mb-2">
                      Libro de Sellos y Visas
                    </span>
                    <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-full py-1 px-3 mt-1 inline-block shadow-sm">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                        {totalSellos} {totalSellos === 1 ? "sello certificado" : "sellos certificados"}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 my-4 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-2 border-[#C5A059] bg-[#45040E] flex flex-col items-center justify-center p-2 shadow-inner shadow-black/60 relative">
                      <div className="absolute inset-1 rounded-full border border-dashed border-[#C5A059]/60" />
                      <Stamp size={36} className="text-[#E8D3A2]" strokeWidth={1.8} />
                      <span className="text-[7.5px] uppercase font-black tracking-widest text-[#E8D3A2] mt-1">
                        Oficial
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 w-full pb-1">
                    <button
                      type="button"
                      onClick={() => cambiarPagina(1, "next")}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#DFBA73] text-[#3B030B] text-xs font-black uppercase tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen size={16} />
                      <span>Abrir Pasaporte</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {paginaActualLibro > conSellos.length && (
                <div
                  key={`contraportada-${paginaActualLibro}-${animacionDireccion}`}
                  className={`bg-gradient-to-b from-[#6A0918] via-[#520510] to-[#3B030B] text-white rounded-2xl p-6 sm:p-8 min-h-[440px] flex flex-col items-center justify-between text-center border border-[#C5A059]/50 relative overflow-hidden ${
                    animacionDireccion === "next" ? "animate-pageFlipNext" : animacionDireccion === "prev" ? "animate-pageFlipPrev" : ""
                  }`}
                >
                  <div className="absolute inset-2.5 rounded-xl border border-[#C5A059]/40 pointer-events-none" />
                  <div className="absolute inset-3.5 rounded-lg border border-[#C5A059]/20 pointer-events-none" />

                  <div className="relative z-10 pt-2 flex flex-col items-center">
                    <span className="text-[11px] tracking-[0.25em] uppercase font-black text-[#E8D3A2] block">
                      PASAPORTE DIGITAL
                    </span>
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#E8D3A2]/80 block mt-0.5 mb-2">
                      Contraportada Oficial
                    </span>
                    <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-full py-1 px-3 mt-1 inline-block shadow-sm">
                      <span className="text-[9px] font-bold text-[#E8D3A2] uppercase tracking-wider">
                        Fin del Cuadernillo
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 my-4 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-2 border-[#C5A059] bg-[#45040E] flex flex-col items-center justify-center p-2 shadow-inner shadow-black/60 relative">
                      <div className="absolute inset-1 rounded-full border border-dashed border-[#C5A059]/60" />
                      <Stamp size={36} className="text-[#E8D3A2]" strokeWidth={1.8} />
                      <span className="text-[7.5px] uppercase font-black tracking-widest text-[#E8D3A2] mt-1">
                        Certificado
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 w-full pb-1">
                    <button
                      type="button"
                      onClick={() => cambiarPagina(0, "next")}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#DFBA73] text-[#3B030B] text-xs font-black uppercase tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                    className={`bg-[#FCFBF7] text-[#2D1A1E] rounded-2xl p-4 sm:p-5 min-h-[440px] flex flex-col justify-between border border-[#E5DACD] relative overflow-hidden shadow-inner ${
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
                        <span>Visas & Sellos Oficiales</span>
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
                              localActual.sellos_obtenidos > 0
                                ? "text-[#7C0A1E] bg-white border-[#E5DACD]"
                                : "text-[#8E7D7D] bg-[#FAF8F5] border-[#E5DACD]"
                            }`}
                          >
                            {localActual.sellos_obtenidos} / {localActual.meta_sellos} sellos
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
                                (localActual.sellos_obtenidos / (localActual.meta_sellos || 10)) * 100
                              )
                            )}%`,
                            backgroundColor: localActual.color_sello || "#7C0A1E",
                          }}
                        />
                      </div>
                    </div>

                    {/* CUADRÍCULA DE SELLOS DINÁMICA SEGÚN META_SELLOS DEL LOCAL */}
                    <div className="relative z-10 py-3 flex-1 flex flex-col justify-center">
                      <div
                        className={`grid gap-2.5 ${getGridColsClass(
                          localActual.meta_sellos || 6
                        )}`}
                      >
                        {Array.from({ length: localActual.meta_sellos || 6 }).map((_, idx) => {
                          const selloObtenido = localActual.sellos_detalle[idx];
                          const color = localActual.color_sello || "#7C0A1E";
                          const isFilled = Boolean(selloObtenido);

                          if (!isFilled) {
                            return (
                              <div
                                key={`slot-empty-${idx}`}
                                className="aspect-square rounded-2xl border-2 border-dashed border-[#DCD3C7] bg-[#F7F4EE]/60 flex flex-col items-center justify-center p-1 text-center select-none"
                              >
                                <span className="text-[9px] font-mono font-bold text-[#A8988B]">
                                  #{idx + 1}
                                </span>
                                <span className="text-[7px] uppercase tracking-tighter text-[#B8AA9D] mt-0.5 leading-none">
                                  Pendiente
                                </span>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={selloObtenido.id_sello || `stamp-${idx}`}
                              type="button"
                              onClick={() =>
                                setSelloDetalle({ sello: selloObtenido, local: localActual })
                              }
                              className="aspect-square rounded-2xl bg-white border border-[#E5DACD] flex flex-col items-center justify-center p-1 text-center shadow-xs hover:border-[#7C0A1E] active:scale-95 transition-all relative group"
                              title="Ver certificación del sello"
                            >
                              {/* Sello circular oficial con tinta notarial */}
                              <div
                                className="w-10 h-10 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-0.5 relative"
                                style={{ borderColor: color, color }}
                              >
                                <div
                                  className="absolute inset-0.5 rounded-full border opacity-50"
                                  style={{ borderColor: color }}
                                />
                                <CategoryIcon
                                  icon={
                                    localActual.imagen_sello ||
                                    localActual.categoria_icono ||
                                    "coffee"
                                  }
                                  size={14}
                                />
                                <span className="text-[7px] font-black leading-none mt-0.5">
                                  #{selloObtenido.numero_sello}
                                </span>
                              </div>

                              {!ocultarFechas && selloObtenido.fecha_otorgamiento && (
                                <span className="text-[7.5px] font-mono text-[#8E7D7D] mt-0.5 block truncate max-w-full leading-tight">
                                  {new Date(selloObtenido.fecha_otorgamiento).toLocaleDateString(
                                    "es-PE",
                                    { day: "2-digit", month: "2-digit" }
                                  )}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Mensaje motivacional si no tiene sellos aún */}
                      {localActual.sellos_obtenidos === 0 && (
                        <div className="mt-3 text-center bg-[#FAF8F5] border border-[#E5DACD] rounded-xl p-2">
                          <p className="text-[10.5px] text-[#6E5D53] font-medium">
                            📍 Aún no has visitado este local. ¡Acerca tu credencial NFC en tienda para conseguir tu primer sello!
                          </p>
                        </div>
                      )}
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

                  {/* Acciones: botón de ver en el libro */}
                  <div className="shrink-0 flex items-center gap-2">
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
                size="md"
                rotation={-2}
              />
            </div>

            <div className="mt-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#6E5D53] block">
                Sello Digital Certificado
              </span>
              <h3 className="text-base font-bold text-[#2D1A1E] mt-0.5">
                {selloDetalle.local?.nombre_comercial || "Establecimiento"}
              </h3>
              <p className="text-xs font-semibold text-[#7C0A1E] mt-0.5">
                Sello #{selloDetalle.sello.numero_sello} de {selloDetalle.local?.meta_sellos || 10}
              </p>

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
    </div>
  );
};
