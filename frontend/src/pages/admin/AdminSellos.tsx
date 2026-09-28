import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import {
  DigitalStampBadge,
  resolveImageUrl,
} from "../../components/common/DigitalStampBadge";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import {
  Stamp,
  Search,
  Building2,
  RotateCcw,
  Eye,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
  Sparkles,
  Info,
  AlertTriangle,
} from "lucide-react";

export const AdminSellos: React.FC = () => {
  const [sellos, setSellos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [modalVer, setModalVer] = useState(false);
  const [modalRestablecer, setModalRestablecer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [selloSeleccionado, setSelloSeleccionado] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const { showToast } = useUI();
  const ITEMS_PER_PAGE = 8;

  const loadSellos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/sellos");
      const list = res.data?.data || res.data || [];
      setSellos(Array.isArray(list) ? list : []);
    } catch {
      showToast("No se pudieron cargar los sellos digitales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellos();
  }, []);

  const sellosFiltrados = useMemo(() => {
    let result = sellos;
    if (filtroEstado !== "TODOS") {
      result = result.filter((s) => s.estado === filtroEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.establecimiento_nombre?.toLowerCase().includes(q) ||
          s.razon_social?.toLowerCase().includes(q) ||
          s.nombre_sello?.toLowerCase().includes(q) ||
          s.descripcion?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [sellos, filtroEstado, search]);

  const totalPaginas = Math.max(1, Math.ceil(sellosFiltrados.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const sellosPaginados = sellosFiltrados.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  const isSelloUnico = (item: any) => {
    if (!item) return true;
    if (item.total_sellos_local !== undefined) {
      return Number(item.total_sellos_local) <= 1;
    }
    return (
      sellos.filter((s) => s.id_establecimiento === item.id_establecimiento)
        .length <= 1
    );
  };

  const openVer = (item: any) => {
    setSelloSeleccionado(item);
    setModalVer(true);
  };

  const openRestablecer = (item: any) => {
    setSelloSeleccionado(item);
    setModalRestablecer(true);
  };

  const openEliminar = (item: any) => {
    if (isSelloUnico(item)) {
      showToast(
        `"${item.nombre_sello}" es el único sello de ${item.establecimiento_nombre}. Todo local debe conservar al menos un sello principal activo.`,
        "info",
      );
      return;
    }
    setSelloSeleccionado(item);
    setModalEliminar(true);
  };

  const handleRestablecerSello = async () => {
    if (!selloSeleccionado) return;
    setBusy(true);
    try {
      await api.post(`/admin/sellos/${selloSeleccionado.id_programa}/restablecer`);
      showToast("Sello restablecido con éxito al diseño básico predeterminado", "success");
      setModalRestablecer(false);
      setModalVer(false);
      await loadSellos();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al restablecer el sello", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEliminarSello = async () => {
    if (!selloSeleccionado) return;
    setBusy(true);
    try {
      await api.delete(`/admin/sellos/${selloSeleccionado.id_programa}`);
      showToast("Sello eliminado con éxito del establecimiento", "success");
      setModalEliminar(false);
      setModalVer(false);
      await loadSellos();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al eliminar el sello", "error");
    } finally {
      setBusy(false);
    }
  };

  const totalSellosOtorgados = sellos.reduce(
    (acc, curr) => acc + (Number(curr.total_sellos_otorgados) || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] flex items-center justify-center font-bold shadow-xs">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#2D1A1E]">
                Diseño y Moderación de Sellos Digitales
              </h1>
              <p className="text-xs text-[#8E7D7D] mt-0.5">
                Supervisa, audita y gestiona las insignias de pasaporte de cada establecimiento
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#8E7D7D] bg-white border border-[#E8DFD5] px-3.5 py-1.5 rounded-xl shadow-2xs">
            {sellos.length} {sellos.length === 1 ? "sello registrado" : "sellos registrados"}
          </span>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Sellos Activos</p>
            <p className="text-xl font-black text-[#2D1A1E] mt-0.5">
              {sellos.filter((s) => s.estado === "ACTIVO").length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Sellos Estampados a Clientes</p>
            <p className="text-xl font-black text-[#7C0A1E] mt-0.5">
              {totalSellosOtorgados}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#7C0A1E] flex items-center justify-center font-bold">
            <Stamp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Sellos Inactivos / Moderados</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">
              {sellos.filter((s) => s.estado === "INACTIVO" || s.estado === "MODERADO").length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E7D7D] pointer-events-none z-10" />
          <input
            type="text"
            className="input-base input-with-search"
            placeholder="Buscar por local, razón social o nombre de sello..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <select
            className="input-base w-full sm:w-48 text-xs font-semibold"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="MODERADO">Moderado</option>
          </select>
        </div>
      </div>

      {/* Listado de Tarjetas de Sellos */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <Spinner size={36} />
        </div>
      ) : sellosFiltrados.length === 0 ? (
        <EmptyState
          icon={Stamp}
          title="No se encontraron sellos digitales"
          description="Intenta cambiando los términos de búsqueda o filtros aplicados."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {sellosPaginados.map((item) => (
              <div
                key={item.id_programa}
                className="bg-white rounded-3xl border border-[#EFE7DE] shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Top Bar del Local */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#EFE7DE] pb-3 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.establecimiento_logo ? (
                        <img
                          src={resolveImageUrl(item.establecimiento_logo)}
                          alt={item.establecimiento_nombre}
                          className="w-8 h-8 rounded-xl object-cover border border-[#EFE7DE] bg-white shrink-0 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] font-bold text-xs shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-black text-[#2D1A1E] truncate block">
                          {item.establecimiento_nombre}
                        </span>
                        {item.razon_social && (
                          <span className="text-[10px] text-[#8E7D7D] truncate block">
                            {item.razon_social}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        item.estado === "ACTIVO"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.estado}
                    </span>
                  </div>

                  {/* Sello Badge Visual Centrado */}
                  <div className="py-4 flex flex-col items-center justify-center bg-[#FAF8F5]/60 rounded-2xl border border-[#EFE7DE]/60 mb-3">
                    <DigitalStampBadge
                      nombre_sello={item.nombre_sello}
                      establecimiento_nombre={item.establecimiento_nombre}
                      imagen_sello={item.imagen_sello}
                      color_sello={item.color_sello}
                      numero_sello={1}
                      size="md"
                      rotation={-3}
                    />
                  </div>

                  {/* Metadatos del Sello */}
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-[#2D1A1E] truncate">
                      {item.nombre_sello || "Sello Sin Título"}
                    </p>
                    <p className="text-[11px] text-[#8E7D7D] truncate">
                      {item.descripcion || "Sin descripción asignada"}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#EFE7DE] grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-[#8E7D7D] block">Color de Tinta:</span>
                      <span className="font-mono font-bold flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: item.color_sello || "#7C0A1E" }}
                        />
                        {item.color_sello || "#7C0A1E"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8E7D7D] block">Emitidos:</span>
                      <span className="font-bold text-[#7C0A1E]">
                        {item.total_sellos_otorgados ?? 0} sellos
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#EFE7DE] flex items-center justify-between text-[11px]">
                    <span className="text-[#8E7D7D] font-medium">Puntos por visita:</span>
                    <span className="font-black text-[#7C0A1E] bg-[#7C0A1E]/10 px-2.5 py-0.5 rounded-lg">
                      +{item.puntos_por_visita || 20} pts
                    </span>
                  </div>
                </div>

                {/* Acciones de Auditoría y Moderación */}
                <div className="mt-4 pt-3 border-t border-[#EFE7DE] flex items-center gap-1.5">
                  <button
                    onClick={() => openVer(item)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E8DFD5] text-xs font-bold text-[#2D1A1E] flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                    title="Visualizar sello en pasaporte digital"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#7C0A1E]" />
                    <span>Ver</span>
                  </button>

                  <button
                    onClick={() => openRestablecer(item)}
                    className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                    title="Restablecer diseño al básico institucional por defecto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer</span>
                  </button>

                  {isSelloUnico(item) ? (
                    <button
                      onClick={() =>
                        showToast(
                          `"${item.nombre_sello}" es el sello principal único de ${item.establecimiento_nombre}. Todo local debe conservar al menos 1 sello activo. Puedes usar "Restablecer" para volver a la plantilla básica.`,
                          "info",
                        )
                      }
                      className="py-2 px-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed opacity-75 shadow-2xs"
                      title="Sello principal único (no se puede eliminar porque el local no puede quedar con 0 sellos)"
                    >
                      <Trash2 className="w-3.5 h-3.5 opacity-40" />
                      <span>Eliminar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openEliminar(item)}
                      className="py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                      title="Eliminar sello secundario / duplicado de este local"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-[#EFE7DE] pt-4 px-2">
              <span className="text-xs text-[#8E7D7D]">
                Página {paginaActual} de {totalPaginas} ({sellosFiltrados.length} sellos totales)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={paginaActual <= 1}
                  onClick={() => setPagina(paginaActual - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPagina(paginaActual + 1)}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Ver en Pasaporte */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Vista de Sello en Pasaporte Digital"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative bg-[#FAF8F5] border-2 border-[#D8C7B5] rounded-3xl p-6 shadow-inner overflow-hidden min-h-[320px] flex flex-col justify-between">
            <div className="relative z-10 flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-[10px] text-[#8E7D7D] font-mono">
              <span className="flex items-center gap-1">
                <Stamp className="w-3.5 h-3.5 text-[#7C0A1E]" />
                PASAPORTE DIGITAL OFICIAL
              </span>
              <span>ESTADO: {selloSeleccionado?.estado || "ACTIVO"}</span>
            </div>

            <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center text-center">
              <DigitalStampBadge
                nombre_sello={selloSeleccionado?.nombre_sello}
                establecimiento_nombre={selloSeleccionado?.establecimiento_nombre}
                imagen_sello={selloSeleccionado?.imagen_sello}
                color_sello={selloSeleccionado?.color_sello}
                numero_sello={1}
                fecha={new Date()}
                size="lg"
                rotation={-3}
              />
              <p className="font-black text-sm text-[#2D1A1E] mt-3">
                {selloSeleccionado?.nombre_sello}
              </p>
              <p className="text-xs text-[#8E7D7D] italic mt-0.5 max-w-sm">
                "{selloSeleccionado?.descripcion || "Visita confirmada en el pasaporte digital"}"
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="bg-white border border-[#E8DFD5] rounded-xl px-3 py-1 text-xs font-bold text-[#2D1A1E] flex items-center gap-1.5">
                  Categoría:{" "}
                  <span className="text-[#7C0A1E] inline-flex items-center gap-1">
                    <CategoryIcon
                      icon={selloSeleccionado?.categoria_icono}
                      className="w-3.5 h-3.5 text-[#7C0A1E]"
                    />{" "}
                    {selloSeleccionado?.categoria_nombre || "General"}
                  </span>
                </span>
                <span className="bg-white border border-[#E8DFD5] rounded-xl px-3 py-1 text-xs font-bold text-[#2D1A1E]">
                  Puntos por visita:{" "}
                  <span className="text-[#7C0A1E] font-black">
                    +{selloSeleccionado?.puntos_por_visita || 20} pts
                  </span>
                </span>
              </div>
            </div>

            <div className="relative z-10 border-t border-[#E8DFD5] pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-[#8E7D7D] font-mono gap-1">
              <span>LOCAL: {selloSeleccionado?.establecimiento_nombre} ({selloSeleccionado?.razon_social})</span>
              <span>EMITIDOS: {selloSeleccionado?.total_sellos_otorgados || 0} sellos</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EFE7DE]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModalVer(false);
                  setModalRestablecer(true);
                }}
                className="px-3 py-2 rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
              {!isSelloUnico(selloSeleccionado) && (
                <button
                  onClick={() => {
                    setModalVer(false);
                    setModalEliminar(true);
                  }}
                  className="px-3 py-2 rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Sello</span>
                </button>
              )}
            </div>
            <Button onClick={() => setModalVer(false)} variant="secondary" size="sm">
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Restablecer Sello a Valores Básicos Iniciales */}
      <Modal
        open={modalRestablecer}
        onClose={() => setModalRestablecer(false)}
        title="Restablecer Sello Digital a Diseño Básico"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">Acción de Auditoría y Moderación:</p>
              <p className="mt-0.5">
                Si el establecimiento subió una imagen ofensiva, rota o un diseño inapropiado, puedes restablecer su insignia a la plantilla estándar oficial asignada al momento de crear el local.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EFE7DE] space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#2D1A1E]">
              Valores a los que se restaurará:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
                <span className="text-[#8E7D7D] block text-[10px] font-bold uppercase">Ícono Básico</span>
                <span className="font-black text-sm text-[#2D1A1E] flex items-center gap-1.5 mt-0.5">
                  <div className="w-6 h-6 rounded-lg bg-[#7C0A1E]/10 flex items-center justify-center text-[#7C0A1E]">
                    <CategoryIcon icon={selloSeleccionado?.categoria_icono || "landmark"} className="w-4 h-4" />
                  </div>
                  {selloSeleccionado?.categoria_nombre || "Categoría"}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
                <span className="text-[#8E7D7D] block text-[10px] font-bold uppercase">Nombre del Sello</span>
                <span className="font-bold text-[#2D1A1E] truncate block mt-0.5">
                  Sello {selloSeleccionado?.establecimiento_nombre}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
                <span className="text-[#8E7D7D] block text-[10px] font-bold uppercase">Color de Tinta Oficial</span>
                <span className="font-bold text-[#7C0A1E] flex items-center gap-1.5 mt-0.5">
                  <span className="w-3 h-3 rounded-full bg-[#7C0A1E] inline-block" />
                  Borgoña Notarial (#7C0A1E)
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DFD5]">
                <span className="text-[#8E7D7D] block text-[10px] font-bold uppercase">Puntos por Sello</span>
                <span className="font-black text-[#7C0A1E] mt-0.5 block">
                  +20 puntos (Estándar)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#8E7D7D] italic pt-1">
              * El historial de visitas de los clientes no se verá afectado; conservarán sus sellos de forma segura.
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="primary"
              fullWidth
              loading={busy}
              onClick={handleRestablecerSello}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Restablecer al Diseño Básico
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setModalRestablecer(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Sello Definitivamente */}
      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar Sello Digital de Establecimiento"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 leading-relaxed">
              <p className="font-bold">¿Deseas eliminar definitivamente este sello?</p>
              <p className="mt-0.5">
                Esta acción eliminará el diseño de sello <strong>"{selloSeleccionado?.nombre_sello}"</strong> del local <strong>"{selloSeleccionado?.establecimiento_nombre}"</strong>. Es ideal para depurar sellos repetidos o no deseados.
              </p>
              {Number(selloSeleccionado?.total_sellos_otorgados) > 0 && (
                <p className="mt-2 font-bold text-red-800 bg-red-100/90 p-2 rounded-xl border border-red-200">
                  ⚠️ Atención: Este sello ya ha sido otorgado {selloSeleccionado.total_sellos_otorgados} veces a clientes. Al eliminarlo, se limpiarán los registros asociados.
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EFE7DE] flex items-center gap-4">
            <DigitalStampBadge
              nombre_sello={selloSeleccionado?.nombre_sello}
              establecimiento_nombre={selloSeleccionado?.establecimiento_nombre}
              imagen_sello={selloSeleccionado?.imagen_sello}
              color_sello={selloSeleccionado?.color_sello}
              numero_sello={1}
              size="sm"
            />
            <div className="space-y-1 text-xs min-w-0 flex-1">
              <p className="font-black text-[#2D1A1E] text-sm truncate">
                {selloSeleccionado?.nombre_sello}
              </p>
              <p className="text-[#8E7D7D] truncate">
                Local: <strong className="text-[#2D1A1E]">{selloSeleccionado?.establecimiento_nombre}</strong>
              </p>
              <p className="text-[#8E7D7D] text-[11px]">
                Emitidos a clientes: <strong className="text-[#7C0A1E]">{selloSeleccionado?.total_sellos_otorgados || 0} sellos</strong>
              </p>
              <p className="text-[#8E7D7D] text-[10px] font-mono">
                ID Programa: #{selloSeleccionado?.id_programa}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="danger"
              fullWidth
              loading={busy}
              onClick={handleEliminarSello}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Sí, Eliminar Sello Definitivamente
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setModalEliminar(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
