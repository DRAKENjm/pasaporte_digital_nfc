import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";
import {
  Stamp,
  Search,
  Building2,
  SquarePen,
  Trash,
  Eye,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Palette,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";

const INK_PALETTE = [
  { name: "Borgoña", hex: "#7C0A1E" },
  { name: "Azul Notarial", hex: "#1E3A8A" },
  { name: "Verde Esmeralda", hex: "#065F46" },
  { name: "Café Espresso", hex: "#451A03" },
  { name: "Ámbar", hex: "#B45309" },
  { name: "Negro Carbón", hex: "#18181B" },
  { name: "Violeta", hex: "#581C87" },
];

export const AdminSellos: React.FC = () => {
  const [sellos, setSellos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [modalEditar, setModalEditar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalModerar, setModalModerar] = useState(false);
  const [selloSeleccionado, setSelloSeleccionado] = useState<any | null>(null);

  // Form State
  const [nombreSello, setNombreSello] = useState("");
  const [imagenSello, setImagenSello] = useState("");
  const [colorSello, setColorSello] = useState("#7C0A1E");
  const [descripcion, setDescripcion] = useState("");
  const [metaSellos, setMetaSellos] = useState(8);
  const [puntosPorVisita, setPuntosPorVisita] = useState(20);
  const [estado, setEstado] = useState("ACTIVO");
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

  const openEditar = (item: any) => {
    setSelloSeleccionado(item);
    setNombreSello(item.nombre_sello || "");
    setImagenSello(item.imagen_sello || "☕");
    setColorSello(item.color_sello || "#7C0A1E");
    setDescripcion(item.descripcion || "");
    setMetaSellos(item.meta_sellos || 8);
    setPuntosPorVisita(item.puntos_por_visita || 20);
    setEstado(item.estado || "ACTIVO");
    setModalEditar(true);
  };

  const openVer = (item: any) => {
    setSelloSeleccionado(item);
    setModalVer(true);
  };

  const openModerar = (item: any) => {
    setSelloSeleccionado(item);
    setModalModerar(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selloSeleccionado) return;
    setBusy(true);
    try {
      await api.patch(`/admin/sellos/${selloSeleccionado.id_programa}`, {
        nombre_sello: nombreSello.trim(),
        imagen_sello: imagenSello.trim(),
        color_sello: colorSello.trim(),
        descripcion: descripcion.trim(),
        meta_sellos: Number(metaSellos),
        puntos_por_visita: Number(puntosPorVisita),
        estado: estado,
      });
      showToast("Sello actualizado correctamente", "success");
      setModalEditar(false);
      await loadSellos();
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo actualizar el sello", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleResetModerar = async () => {
    if (!selloSeleccionado) return;
    setBusy(true);
    try {
      await api.delete(`/admin/sellos/${selloSeleccionado.id_programa}`);
      showToast("Sello restablecido a valores estándar de moderación", "success");
      setModalModerar(false);
      await loadSellos();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al moderar el sello", "error");
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
                Supervisa y audita las insignias de pasaporte personalizadas de cada establecimiento
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#8E7D7D] bg-white border border-[#E8DFD5] px-3.5 py-1.5 rounded-xl shadow-2xs">
            {sellos.length} {sellos.length === 1 ? "local con sello" : "locales con sello"}
          </span>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Locales con Sello Activo</p>
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
            <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Sellos Bajo Moderación</p>
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
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] font-bold text-xs shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#2D1A1E] truncate">
                        {item.establecimiento_nombre}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
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
                          className="w-2.5 h-2.5 rounded-full inline-block"
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
                    <span className="text-[#8E7D7D] font-medium">Puntos por visita / sello:</span>
                    <span className="font-black text-[#7C0A1E] bg-[#7C0A1E]/10 px-2.5 py-0.5 rounded-lg">
                      +{item.puntos_por_visita || 20} pts
                    </span>
                  </div>
                </div>

                {/* Acciones de Auditoría y Moderación */}
                <div className="mt-4 pt-3 border-t border-[#EFE7DE] flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => openVer(item)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-[#FAF8F5] transition"
                    title="Ver en pasaporte"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openEditar(item)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center gap-1 transition"
                  >
                    <SquarePen className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => openModerar(item)}
                    className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                    title="Moderar / Resetear si es inapropiado"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-xs text-[#8E7D7D]">
                Página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
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

      {/* Modal Editar Sello */}
      <Modal
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        title={`Editar Sello: ${selloSeleccionado?.establecimiento_nombre || ""}`}
        size="md"
      >
        <form onSubmit={handleGuardar} className="space-y-4">
          <Input
            label="Nombre del Sello *"
            value={nombreSello}
            onChange={(e) => setNombreSello(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
              Lema o Descripción
            </label>
            <input
              type="text"
              className="input-base"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Icono o Emoji Central
              </label>
              <input
                type="text"
                className="input-base"
                value={imagenSello}
                onChange={(e) => setImagenSello(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Color de Tinta (HEX)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorSello}
                  onChange={(e) => setColorSello(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-[#EFE7DE]"
                />
                <input
                  type="text"
                  className="input-base text-xs font-mono"
                  value={colorSello}
                  onChange={(e) => setColorSello(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Puntos por Visita / Sello *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                className="input-base font-black text-[#7C0A1E]"
                value={puntosPorVisita}
                onChange={(e) => setPuntosPorVisita(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-[#8E7D7D] mt-0.5 block">
                Puntos que se acreditan al cliente al validar un sello con NFC.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Meta de Sellos
              </label>
              <input
                type="number"
                min="1"
                max="20"
                className="input-base font-bold"
                value={metaSellos}
                onChange={(e) => setMetaSellos(Number(e.target.value))}
              />
              <span className="text-[10px] text-[#8E7D7D] mt-0.5 block">
                Sellos para completar el pasaporte.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
              Estado de Moderación
            </label>
            <select
              className="input-base"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="ACTIVO">Activo (Aprobado)</option>
              <option value="INACTIVO">Inactivo / Pausado</option>
              <option value="MODERADO">Bajo Moderación</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={busy} fullWidth>
              Guardar Cambios
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setModalEditar(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver en Pasaporte */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Vista en Pasaporte de Cliente"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative bg-[#FAF8F5] border-2 border-[#D8C7B5] rounded-3xl p-6 shadow-inner overflow-hidden min-h-[320px] flex flex-col justify-between">
            <div className="relative z-10 flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-[10px] text-[#8E7D7D] font-mono">
              <span>PASAPORTE OFICIAL</span>
              <span>VERIFICACIÓN DIGITAL</span>
            </div>

            <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center">
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
              <p className="font-bold text-xs text-[#2D1A1E] mt-3">
                {selloSeleccionado?.nombre_sello}
              </p>
              <p className="text-[11px] text-[#8E7D7D] italic mt-0.5">
                "{selloSeleccionado?.descripcion || "Visita confirmada"}"
              </p>

              <div className="mt-3 bg-white/90 border border-[#E8DFD5] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-[#2D1A1E]">
                <span>Puntos por sello:</span>
                <span className="text-[#7C0A1E] font-black">
                  +{selloSeleccionado?.puntos_por_visita || 20} pts
                </span>
              </div>
            </div>

            <div className="relative z-10 border-t border-[#E8DFD5] pt-2 flex items-center justify-between text-[9px] text-[#8E7D7D] font-mono">
              <span>ESTABLECIMIENTO: {selloSeleccionado?.razon_social}</span>
              <span>ID PROGRAMA: #{selloSeleccionado?.id_programa}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setModalVer(false)} variant="secondary">
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Moderar / Resetear Sello */}
      <Modal
        open={modalModerar}
        onClose={() => setModalModerar(false)}
        title="Moderar Sello Digital"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            ¿Deseas restablecer el sello digital de{" "}
            <strong className="text-slate-900">{selloSeleccionado?.establecimiento_nombre}</strong> a sus valores estándar de moderación?
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Si el establecimiento subió un logo o nombre inapropiado u ofensivo, esta acción restablece la insignia a la estándar institucional y mantiene el historial de visitas de los clientes seguro.
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="danger" fullWidth loading={busy} onClick={handleResetModerar}>
              Restablecer Sello
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setModalModerar(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
