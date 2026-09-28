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
  Award,
} from "lucide-react";
import api from "../../services/api";

interface SelloDetalle {
  id_sello: number;
  numero_sello: number;
  fecha_otorgamiento: string;
  es_festivo?: number;
}

interface EstablecimientoSellos {
  id_establecimiento: string | number;
  nombre_comercial: string;
  descripcion?: string;
  logo?: string;
  imagen_portada?: string;
  direccion?: string;
  categoria_id?: number;
  categoria_nombre?: string;
  categoria_icono?: string;
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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todas");
  const [localModal, setLocalModal] = useState<EstablecimientoSellos | null>(null);
  const [paginaLibro, setPaginaLibro] = useState(0);
  const [ocultarFechas, setOcultarFechas] = useState(() => {
    return localStorage.getItem("pd_ocultar_fechas_sellos") === "1";
  });
  const [selloDetalle, setSelloDetalle] = useState<SelloDetalle | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/activity/mis-sellos");
        setLocalesSellos(res.data?.data || []);
      } catch (err) {
        console.error("Error al cargar sellos", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      default:
        return Compass;
    }
  };

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>(["Todas"]);
    localesSellos.forEach((l) => {
      if (l.categoria_nombre) set.add(l.categoria_nombre);
    });
    return Array.from(set);
  }, [localesSellos]);

  const filtrados = useMemo(() => {
    return localesSellos.filter((l) => {
      if (categoriaSeleccionada === "Todas") return true;
      return l.categoria_nombre === categoriaSeleccionada;
    });
  }, [localesSellos, categoriaSeleccionada]);

  // Solo locales con al menos 1 sello para la vista circular principal
  const conSellos = useMemo(
    () => filtrados.filter((l) => (l.sellos_obtenidos || 0) > 0),
    [filtrados]
  );

  const totalSellos = useMemo(
    () => localesSellos.reduce((acc, l) => acc + (l.sellos_obtenidos || 0), 0),
    [localesSellos]
  );

  const toggleOcultarFechas = async () => {
    const next = !ocultarFechas;
    setOcultarFechas(next);
    localStorage.setItem("pd_ocultar_fechas_sellos", next ? "1" : "0");
    try {
      await api.patch("/auth/preferencias", { ocultar_fechas_sellos: next ? 1 : 0 });
    } catch {
      /* ok local */
    }
  };

  const compartir = async (item: EstablecimientoSellos) => {
    const texto = ocultarFechas
      ? `¡Tengo ${item.sellos_obtenidos} sellos en ${item.nombre_comercial}! 🎫 Pasaporte Digital NFC`
      : `¡Tengo ${item.sellos_obtenidos}/${item.meta_sellos} sellos en ${item.nombre_comercial}! 🎫 Pasaporte Digital NFC`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mis Sellos", text: texto });
      } catch {
        /* cancel */
      }
    } else {
      await navigator.clipboard.writeText(texto);
      alert("Texto copiado para compartir");
    }
  };

  const sellosAll = localModal?.sellos_detalle || [];
  // Libro: cada "hoja" muestra hasta 18 sellos (9 izq + 9 der), redondos
  const POR_PAGINA = 18;
  const totalPaginas = Math.max(1, Math.ceil(sellosAll.length / POR_PAGINA) || 1);
  const hoja = sellosAll.slice(paginaLibro * POR_PAGINA, paginaLibro * POR_PAGINA + POR_PAGINA);
  const izq = hoja.slice(0, 9);
  const der = hoja.slice(9, 18);

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col pb-8">
      {/* Header fijo mejorado */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#EFE7DE] px-4 pt-3 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link
              to="/user/home"
              className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E]"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#2D1A1E]">Mis Sellos</h1>
              <p className="text-[10px] text-[#8E7D7D]">{totalSellos} sellos en total</p>
            </div>
          </div>
          <button
            onClick={toggleOcultarFechas}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] text-[10px] font-bold text-[#7C0A1E]"
            title="Ocultar fechas al compartir"
          >
            {ocultarFechas ? <EyeOff size={14} /> : <Eye size={14} />}
            {ocultarFechas ? "Fechas ocultas" : "Mostrar fechas"}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriasDisponibles.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSeleccionada(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categoriaSeleccionada === cat
                  ? "bg-[#7C0A1E] text-white shadow-sm"
                  : "bg-[#FAF8F5] text-[#8E7D7D] border border-[#EFE7DE]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-8 h-8 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#8E7D7D] mt-3">Cargando colección...</p>
          </div>
        ) : conSellos.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE7DE] text-center shadow-sm">
            <Stamp className="w-12 h-12 text-[#C5A059] mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Aún no tienes sellos</h3>
            <p className="text-xs text-[#8E7D7D] mt-1">
              Visita locales afiliados y usa tu tarjeta NFC.
            </p>
            <Link
              to="/user/locales"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold"
            >
              <Store size={14} /> Explorar locales
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {conSellos.map((item) => (
              <button
                key={item.id_establecimiento}
                type="button"
                onClick={() => {
                  setLocalModal(item);
                  setPaginaLibro(0);
                  setSelloDetalle(null);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#C5A059] shadow-md group-active:scale-95 transition-transform bg-white">
                  <img
                    src={
                      item.logo ||
                      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                    }
                    alt={item.nombre_comercial}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-[#7C0A1E]/90 text-white text-[9px] font-bold py-0.5 text-center">
                    {item.sellos_obtenidos}/{item.meta_sellos}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#2D1A1E] text-center line-clamp-2 leading-tight px-0.5">
                  {item.nombre_comercial}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal libro de sellos */}
      {localModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Banner */}
            <div className="relative h-28 bg-[#7C0A1E] shrink-0">
              {(localModal.imagen_portada || localModal.logo) && (
                <img
                  src={localModal.imagen_portada || localModal.logo}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              )}
              <button
                onClick={() => setLocalModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
              <div className="absolute -bottom-8 left-4 flex items-end gap-3">
                <img
                  src={
                    localModal.logo ||
                    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150"
                  }
                  alt=""
                  className="w-16 h-16 rounded-full border-4 border-white object-cover shadow-md"
                />
              </div>
            </div>

            <div className="pt-10 px-4 pb-3">
              <h2 className="text-base font-bold text-[#2D1A1E]">{localModal.nombre_comercial}</h2>
              <p className="text-[11px] text-[#8E7D7D] mt-0.5 line-clamp-2">
                {localModal.descripcion || localModal.direccion || "Local afiliado"}
              </p>
              <p className="text-xs font-bold text-[#7C0A1E] mt-2">
                {localModal.sellos_obtenidos} sellos · meta {localModal.meta_sellos}
              </p>
            </div>

            {/* Libro */}
            <div className="px-4 pb-4 flex-1 overflow-y-auto">
              <div className="relative bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-3 min-h-[200px] shadow-inner">
                <p className="text-[10px] font-bold text-[#8E7D7D] uppercase tracking-wider mb-2">
                  Libro de sellos · hoja {paginaLibro + 1}/{totalPaginas}
                </p>
                {sellosAll.length === 0 ? (
                  <p className="text-xs text-[#8E7D7D] text-center py-8">Sin sellos aún</p>
                ) : (
                  <div className="flex gap-2 items-stretch">
                    {/* Página izquierda 3x3 */}
                    <div className="flex-1 grid grid-cols-3 gap-1.5 bg-white rounded-xl p-2 border border-[#EFE7DE] min-h-[140px]">
                      {Array.from({ length: 9 }).map((_, i) => {
                        const s = izq[i];
                        if (!s) return <div key={i} className="aspect-square rounded-full bg-[#FAF8F5]" />;
                        return (
                          <button
                            key={s.id_sello || i}
                            type="button"
                            onClick={() => setSelloDetalle(s)}
                            className={`aspect-square rounded-full overflow-hidden border-2 shadow-sm ${
                              s.es_festivo ? "border-[#C5A059] ring-1 ring-[#C5A059]" : "border-[#EFE7DE]"
                            }`}
                            title={!ocultarFechas && s.fecha_otorgamiento ? new Date(s.fecha_otorgamiento).toLocaleString() : `#${s.numero_sello}`}
                          >
                            <img
                              src={localModal.imagen_sello || localModal.logo || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                    {/* Lomo */}
                    <div className="w-1.5 bg-gradient-to-b from-[#C5A059]/40 via-[#7C0A1E]/30 to-[#C5A059]/40 rounded-full self-stretch" />
                    {/* Página derecha 3x3 */}
                    <div className="flex-1 grid grid-cols-3 gap-1.5 bg-white rounded-xl p-2 border border-[#EFE7DE] min-h-[140px]">
                      {Array.from({ length: 9 }).map((_, i) => {
                        const s = der[i];
                        if (!s) return <div key={i} className="aspect-square rounded-full bg-[#FAF8F5]" />;
                        return (
                          <button
                            key={s.id_sello || i}
                            type="button"
                            onClick={() => setSelloDetalle(s)}
                            className={`aspect-square rounded-full overflow-hidden border-2 shadow-sm ${
                              s.es_festivo ? "border-[#C5A059] ring-1 ring-[#C5A059]" : "border-[#EFE7DE]"
                            }`}
                          >
                            <img
                              src={localModal.imagen_sello || localModal.logo || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between w-full mt-3">
                    <button type="button" disabled={paginaLibro <= 0} onClick={() => setPaginaLibro((p) => Math.max(0, p - 1))} className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center disabled:opacity-30">
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-[10px] text-[#8E7D7D] font-medium">{sellosAll.length} sellos</span>
                    <button type="button" disabled={paginaLibro >= totalPaginas - 1} onClick={() => setPaginaLibro((p) => Math.min(totalPaginas - 1, p + 1))} className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center disabled:opacity-30">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => compartir(localModal)}
                className="mt-3 w-full py-2.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Compartir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalle de un sello */}
      {selloDetalle && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-xl">
            <Award size={48} className="mx-auto text-[#7C0A1E] mb-2" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">
              Sello #{selloDetalle.numero_sello}
            </h3>
            {!ocultarFechas && (
              <p className="text-xs text-[#8E7D7D] mt-1">
                {new Date(selloDetalle.fecha_otorgamiento).toLocaleString()}
              </p>
            )}
            {!!selloDetalle.es_festivo && (
              <span className="inline-block mt-2 text-[10px] font-bold text-[#C5A059] border border-[#C5A059] px-2 py-0.5 rounded-full">
                Edición festiva
              </span>
            )}
            <button
              onClick={() => setSelloDetalle(null)}
              className="mt-4 w-full py-2 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#8E7D7D]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
