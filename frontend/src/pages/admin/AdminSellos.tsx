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
import { CategoryIcon, MODERN_CATEGORY_PRESETS } from "../../components/common/CategoryIcon";
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
  Pencil,
  Upload,
  Palette,
  Save,
  Image as ImageIcon,
  Landmark,
  Camera,
  Compass,
  Ticket,
  Wifi,
  QrCode,
} from "lucide-react";

// Paleta oficial de tintas notariales y de pasaporte
const INK_PALETTE = [
  { name: "Borgoña Pasaporte", hex: "#7C0A1E" },
  { name: "Azul Notarial", hex: "#1E3A8A" },
  { name: "Verde Esmeralda", hex: "#065F46" },
  { name: "Café Espresso", hex: "#451A03" },
  { name: "Ámbar Dorado", hex: "#B45309" },
  { name: "Negro Carbón", hex: "#18181B" },
  { name: "Violeta Diplomático", hex: "#581C87" },
];

// Insignias e íconos especializados únicamente en turismo, monumentos y experiencias
const TOURISM_EXPERIENCE_ICONS = [
  { id: "landmark", name: "Monumento / Patrimonio", icon: Landmark },
  { id: "sparkles", name: "Experiencia Turística", icon: Sparkles },
  { id: "camera", name: "Mirador / Fotografía", icon: Camera },
  { id: "compass", name: "Exploración / Aventura", icon: Compass },
  { id: "ticket", name: "Atracción / Pase", icon: Ticket },
  { id: "building", name: "Centro Histórico", icon: Building2 },
];

export const AdminSellos: React.FC = () => {
  const [tab, setTab] = useState<"disenos" | "historial">("disenos");

  const [sellos, setSellos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  // Historial de sellos otorgados
  const [historialSellos, setHistorialSellos] = useState<any[]>([]);
  const [metricasHistorial, setMetricasHistorial] = useState<any>({});
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [searchHistorial, setSearchHistorial] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("TODOS");
  const [paginaHistorial, setPaginaHistorial] = useState(1);

  // Modales
  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalRestablecer, setModalRestablecer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalNfc, setModalNfc] = useState(false);
  const [selloSeleccionado, setSelloSeleccionado] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  // Estado vinculación Sello NFC físico
  const [nfcUidInput, setNfcUidInput] = useState("");
  const [savingNfc, setSavingNfc] = useState(false);

  // Estados de edición
  const [editNombreSello, setEditNombreSello] = useState("");
  const [editImagenSello, setEditImagenSello] = useState("landmark");
  const [editColorSello, setEditColorSello] = useState("#7C0A1E");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMetaSellos, setEditMetaSellos] = useState(8);
  const [editPuntosPorVisita, setEditPuntosPorVisita] = useState(20);
  const [editEstado, setEditEstado] = useState("ACTIVO");
  const [customIconModeEdit, setCustomIconModeEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const { showToast } = useUI();
  const ITEMS_PER_PAGE = 8;
  const HISTORIAL_PER_PAGE = 12;

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

  const loadHistorialSellos = async () => {
    setLoadingHistorial(true);
    try {
      const res = await api.get("/admin/sellos/historial");
      const data = res.data?.data || res.data || {};
      setHistorialSellos(data.historial || []);
      setMetricasHistorial(data.metricas || {});
    } catch {
      showToast("No se pudo cargar el historial de sellos otorgados", "error");
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    loadSellos();
    loadHistorialSellos();
  }, []);

  const historialFiltrado = useMemo(() => {
    let result = historialSellos;
    if (filtroMetodo !== "TODOS") {
      result = result.filter((h) => {
        if (filtroMetodo === "QR") return h.metodo_validacion === "QR" || h.metodo_validacion === "QR_RESPALDO";
        return h.metodo_validacion === filtroMetodo;
      });
    }
    if (searchHistorial.trim()) {
      const q = searchHistorial.toLowerCase();
      result = result.filter(
        (h) =>
          h.establecimiento_nombre?.toLowerCase().includes(q) ||
          h.sucursal_nombre?.toLowerCase().includes(q) ||
          h.cliente_nombres?.toLowerCase().includes(q) ||
          h.cliente_apellidos?.toLowerCase().includes(q) ||
          h.cliente_email?.toLowerCase().includes(q) ||
          h.codigo_cliente?.toLowerCase().includes(q) ||
          h.nombre_sello?.toLowerCase().includes(q) ||
          h.uid_nfc?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [historialSellos, filtroMetodo, searchHistorial]);

  const totalPaginasHistorial = Math.max(1, Math.ceil(historialFiltrado.length / HISTORIAL_PER_PAGE));
  const historialPaginado = historialFiltrado.slice(
    (paginaHistorial - 1) * HISTORIAL_PER_PAGE,
    paginaHistorial * HISTORIAL_PER_PAGE
  );

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

  const isLugarTuristico = (item: any) => {
    if (!item) return false;
    const t = String(item.establecimiento_tipo || item.tipo || "").toUpperCase();
    if (t === "LUGAR" || t === "LUGAR_TURISTICO" || t === "TURISTICO") return true;
    const cat = String(item.categoria_nombre || "").toLowerCase();
    if (
      cat.includes("turismo") ||
      cat.includes("monumento") ||
      cat.includes("cultura") ||
      cat.includes("patrimonio") ||
      cat.includes("parque")
    ) {
      return true;
    }
    const nombre = String(item.establecimiento_nombre || "").toLowerCase();
    if (
      nombre.includes("catedral") ||
      nombre.includes("plaza") ||
      nombre.includes("museo") ||
      nombre.includes("bosque") ||
      nombre.includes("monumento") ||
      nombre.includes("ruina") ||
      nombre.includes("huaca") ||
      nombre.includes("mirador")
    ) {
      return true;
    }
    return false;
  };

  const openVer = (item: any) => {
    setSelloSeleccionado(item);
    setModalVer(true);
  };

  const openEditar = (item: any) => {
    setSelloSeleccionado(item);
    setEditNombreSello(item.nombre_sello || "");
    setEditImagenSello(item.imagen_sello || item.categoria_icono || "landmark");
    setEditColorSello(item.color_sello || "#7C0A1E");
    setEditDescripcion(item.descripcion || "");
    setEditMetaSellos(Number(item.meta_sellos ?? 8));
    setEditPuntosPorVisita(Number(item.puntos_por_visita ?? 20));
    setEditEstado(item.estado || "ACTIVO");
    setCustomIconModeEdit(
      !TOURISM_EXPERIENCE_ICONS.some((p) => p.id === item.imagen_sello) &&
      Boolean(item.imagen_sello?.startsWith("http") || item.imagen_sello?.startsWith("/"))
    );
    setModalEditar(true);
  };

  const openVincularNfc = (item: any) => {
    setSelloSeleccionado(item);
    setNfcUidInput(item.sello_nfc_uid || "");
    setModalNfc(true);
  };

  const handleGuardarNfc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selloSeleccionado) return;
    setSavingNfc(true);
    try {
      const res = await api.patch(`/admin/sellos/${selloSeleccionado.id || selloSeleccionado.id_programa}/nfc`, {
        sello_nfc_uid: nfcUidInput.trim() || null,
      });
      showToast(res.data?.message || "Sello NFC actualizado con éxito", "success");
      setModalNfc(false);
      await loadSellos();
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo vincular el Sello NFC", "error");
    } finally {
      setSavingNfc(false);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selloSeleccionado) return;
    if (!editNombreSello.trim()) {
      showToast("El nombre del sello es obligatorio", "error");
      return;
    }
    setSavingEdit(true);
    try {
      await api.patch(`/admin/sellos/${selloSeleccionado.id_programa}`, {
        nombre_sello: editNombreSello.trim(),
        imagen_sello: editImagenSello.trim(),
        color_sello: editColorSello,
        descripcion: editDescripcion.trim(),
        meta_sellos: editMetaSellos,
        puntos_por_visita: editPuntosPorVisita,
        estado: editEstado,
      });
      showToast("Diseño de sello actualizado con éxito", "success");
      setModalEditar(false);
      await loadSellos();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al actualizar el sello", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUploadSelloImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) {
      showToast("Formato no soportado. Usa JPG, PNG, WebP o AVIF", "error");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", "sello");
    setUploadingImg(true);
    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setEditImagenSello(url);
        showToast("Imagen de insignia subida correctamente", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al subir la imagen", "error");
    } finally {
      setUploadingImg(false);
    }
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
                Gestión y Seguimiento de Sellos Digitales
              </h1>
              <p className="text-xs text-[#8E7D7D] mt-0.5">
                Supervisa el catálogo de diseños y audita el historial global de sellos brindados en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#FAF8F5] p-1 rounded-2xl border border-[#E8DFD5] shadow-2xs">
          <button
            onClick={() => setTab("disenos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              tab === "disenos"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#8E7D7D] hover:text-[#2D1A1E]"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Diseños ({sellos.length})</span>
          </button>
          <button
            onClick={() => {
              setTab("historial");
              loadHistorialSellos();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              tab === "historial"
                ? "bg-[#7C0A1E] text-white shadow-xs"
                : "text-[#8E7D7D] hover:text-[#2D1A1E]"
            }`}
          >
            <Stamp className="w-4 h-4" />
            <span>Historial Otorgados ({metricasHistorial.total_sellos ?? historialSellos.length})</span>
          </button>
        </div>
      </div>

      {tab === "disenos" ? (
        <>
          {/* Métricas rápidas Diseños */}
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

          {/* Barra de Filtros Diseños */}
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
                        <span className="text-[#8E7D7D] font-medium">Sello Físico NFC:</span>
                        {item.sello_nfc_uid ? (
                          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {item.sello_nfc_uid}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#8E7D7D] bg-slate-100 px-2 py-0.5 rounded-md">
                            Sin vincular
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-[#EFE7DE] flex items-center justify-between text-[11px]">
                        <span className="text-[#8E7D7D] font-medium">Puntos por visita:</span>
                        <span className="font-black text-[#7C0A1E] bg-[#7C0A1E]/10 px-2.5 py-0.5 rounded-lg">
                          +{item.puntos_por_visita || 20} pts
                        </span>
                      </div>
                    </div>

                    {/* Acciones de Auditoría y Moderación */}
                    <div className="mt-4 pt-3 border-t border-[#EFE7DE] flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => openVer(item)}
                        className="py-2 px-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E8DFD5] text-xs font-bold text-[#2D1A1E] flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                        title="Visualizar sello en pasaporte digital"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#7C0A1E]" />
                        <span>Ver</span>
                      </button>

                      <button
                        onClick={() => openVincularNfc(item)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs ${
                          item.sello_nfc_uid
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-[#FAF8F5] text-[#7C0A1E] border-[#E8DFD5] hover:bg-amber-50"
                        }`}
                        title="Vincular chip NFC físico del local"
                      >
                        <Wifi className="w-3.5 h-3.5 rotate-90" />
                        <span>{item.sello_nfc_uid ? "Sello NFC" : "Vincular NFC"}</span>
                      </button>

                      {isLugarTuristico(item) && (
                        <button
                          onClick={() => openEditar(item)}
                          className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                          title="Editar sello del lugar turístico (auto-sellado)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}

                      <button
                        onClick={() => openRestablecer(item)}
                        className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                        title="Restablecer diseño al básico institucional por defecto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
        </>
      ) : (
        /* ===== TAB HISTORIAL GLOBAL DE SELLOS OTORGADOS ===== */
        <div className="space-y-4 animate-fadeIn">
          {/* Métricas del Historial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Total Otorgados</p>
              <p className="text-xl font-black text-[#7C0A1E] mt-0.5">
                {metricasHistorial.total_sellos ?? historialSellos.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Sellos Hoy</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">
                {metricasHistorial.sellos_hoy ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Por Tarjeta NFC</p>
              <p className="text-xl font-black text-blue-700 mt-0.5">
                {metricasHistorial.sellos_nfc ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EFE7DE] shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider">Auto-sellado GPS</p>
              <p className="text-xl font-black text-purple-700 mt-0.5">
                {metricasHistorial.sellos_autosellado ?? 0}
              </p>
            </div>
          </div>

          {/* Filtros de Historial */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E7D7D] pointer-events-none z-10" />
              <input
                type="text"
                className="input-base input-with-search"
                placeholder="Buscar por cliente, código, establecimiento o sello..."
                value={searchHistorial}
                onChange={(e) => setSearchHistorial(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
              <select
                className="input-base text-xs font-semibold"
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value)}
              >
                <option value="TODOS">Todos los métodos</option>
                <option value="NFC">Tarjeta NFC</option>
                <option value="QR">Código QR</option>
                <option value="AUTOSELLADO">Auto-sellado GPS</option>
              </select>

              <button
                onClick={loadHistorialSellos}
                className="p-2.5 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FAF8F5] text-[#2D1A1E] transition shadow-2xs"
                title="Refrescar historial"
              >
                <RotateCcw className={`w-4 h-4 ${loadingHistorial ? "animate-spin text-[#7C0A1E]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Tabla de Historial */}
          {loadingHistorial ? (
            <div className="py-24 flex justify-center">
              <Spinner size={36} />
            </div>
          ) : historialFiltrado.length === 0 ? (
            <EmptyState
              icon={Stamp}
              title="No hay registros de sellos otorgados"
              description="Los sellos brindados por comercios y auto-sellados aparecerán aquí."
            />
          ) : (
            <div className="bg-white rounded-3xl border border-[#EFE7DE] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#EFE7DE] text-[10px] uppercase font-bold text-[#8E7D7D] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Establecimiento</th>
                      <th className="px-4 py-3">Sello Otorgado</th>
                      <th className="px-4 py-3">Puntos</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Validador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE7DE]">
                    {historialPaginado.map((h) => {
                      const fecha = new Date(h.fecha_otorgamiento || h.fecha_visita).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const metodo = h.metodo_validacion;

                      return (
                        <tr key={h.id_sello} className="hover:bg-[#FAF8F5]/60 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-[#6E5D53]">
                            {fecha}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              {h.cliente_foto ? (
                                <img
                                  src={resolveImageUrl(h.cliente_foto)}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover border border-[#EFE7DE]"
                                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-rose-50 text-[#7C0A1E] font-bold text-[10px] flex items-center justify-center border border-[#7C0A1E]/20">
                                  {h.cliente_nombres ? h.cliente_nombres.charAt(0) : "C"}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-[#2D1A1E]">
                                  {h.cliente_nombres} {h.cliente_apellidos}
                                </p>
                                <p className="text-[10px] text-[#8E7D7D] font-mono">
                                  {h.codigo_cliente || h.cliente_email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div>
                              <p className="font-bold text-[#2D1A1E]">{h.establecimiento_nombre}</p>
                              <p className="text-[10px] text-[#8E7D7D]">{h.sucursal_nombre}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                style={{ backgroundColor: h.color_sello || "#7C0A1E" }}
                              >
                                #{h.numero_sello}
                              </span>
                              <span className="font-medium text-[#2D1A1E]">{h.nombre_sello}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              +{h.puntos_otorgados || 20} pts
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {metodo === "NFC" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                💳 Tarjeta NFC
                              </span>
                            ) : metodo === "AUTOSELLADO" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                📍 Auto-sellado GPS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                📱 Código QR
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-[#6E5D53]">
                            {h.validador_nombres ? (
                              <span>{h.validador_nombres} {h.validador_apellidos}</span>
                            ) : metodo === "AUTOSELLADO" ? (
                              <span className="italic text-purple-700">Verificado por GPS</span>
                            ) : (
                              <span className="text-[#8E7D7D]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación Historial */}
              {totalPaginasHistorial > 1 && (
                <div className="flex items-center justify-between border-t border-[#EFE7DE] p-3 px-4">
                  <span className="text-xs text-[#8E7D7D]">
                    Página {paginaHistorial} de {totalPaginasHistorial} ({historialFiltrado.length} registros)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={paginaHistorial <= 1}
                      onClick={() => setPaginaHistorial(paginaHistorial - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={paginaHistorial >= totalPaginasHistorial}
                      onClick={() => setPaginaHistorial(paginaHistorial + 1)}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
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
              {isLugarTuristico(selloSeleccionado) && (
                <button
                  onClick={() => {
                    setModalVer(false);
                    openEditar(selloSeleccionado);
                  }}
                  className="px-3 py-2 rounded-xl text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Sello de Lugar</span>
                </button>
              )}
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

      {/* Modal Editar Diseño de Sello para Lugares Turísticos */}
      <Modal
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        title={`Editar Sello de Lugar Turístico · ${selloSeleccionado?.establecimiento_nombre || "Lugar"}`}
        size="lg"
      >
        <form onSubmit={handleGuardarEdicion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Visualización en Vivo del Sello */}
            <div className="md:col-span-4 bg-[#FAF8F5] border border-[#EFE7DE] rounded-3xl p-4 flex flex-col items-center justify-center text-center sticky top-2 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-[#8E7D7D] tracking-wider mb-3">
                Vista Previa en Vivo
              </span>
              <div className="my-2">
                <DigitalStampBadge
                  nombre_sello={editNombreSello || "Sello Oficial"}
                  establecimiento_nombre={selloSeleccionado?.establecimiento_nombre || "Lugar"}
                  imagen_sello={editImagenSello}
                  color_sello={editColorSello}
                  numero_sello={1}
                  fecha={new Date()}
                  size="md"
                  rotation={-3}
                />
              </div>
              <p className="text-xs font-bold text-[#2D1A1E] mt-2 truncate w-full">
                {editNombreSello || "Sello Sin Título"}
              </p>
              <p className="text-[10px] text-[#8E7D7D] italic mt-0.5 line-clamp-2">
                "{editDescripcion || "Visita confirmada en pasaporte digital"}"
              </p>

              <div className="w-full mt-3 pt-2.5 border-t border-[#EFE7DE] space-y-1.5 text-[10px] text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E7D7D]">Meta ciclo:</span>
                  <strong className="text-[#2D1A1E]">{editMetaSellos} sellos</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8E7D7D]">Puntos por visita:</span>
                  <strong className="text-[#7C0A1E]">+{editPuntosPorVisita} pts</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8E7D7D]">Estado:</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                    editEstado === "ACTIVO" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {editEstado}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario de Configuración del Sello */}
            <div className="md:col-span-8 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2D1A1E] mb-1">
                  Nombre del Sello *
                </label>
                <input
                  type="text"
                  required
                  value={editNombreSello}
                  onChange={(e) => setEditNombreSello(e.target.value)}
                  placeholder="Ej: Sello Catedral Chiclayo, Sello Bosque de Pomac..."
                  className="input-base w-full text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1A1E] mb-1">
                  Descripción / Leyenda del Sello
                </label>
                <input
                  type="text"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Ej: Visita y validación en monumento histórico"
                  className="input-base w-full text-xs"
                />
              </div>

              {/* Selector de Tinta Notarial */}
              <div>
                <label className="block text-xs font-bold text-[#2D1A1E] mb-1.5">
                  Color de Tinta Oficial
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {INK_PALETTE.map((ink) => (
                    <button
                      key={ink.hex}
                      type="button"
                      onClick={() => setEditColorSello(ink.hex)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
                        editColorSello === ink.hex
                          ? "border-[#2D1A1E] bg-white shadow-2xs ring-2 ring-[#7C0A1E]/30 font-bold"
                          : "border-[#EFE7DE] bg-white hover:bg-[#FAF8F5] text-[#2D1A1E]"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: ink.hex }}
                      />
                      <span>{ink.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selección de Ícono o Insignia de Turismo y Experiencias */}
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EFE7DE] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D1A1E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#7C0A1E]" />
                    Insignia de Turismo o Experiencia
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomIconModeEdit(!customIconModeEdit)}
                    className="text-[11px] font-bold text-[#7C0A1E] hover:underline"
                  >
                    {customIconModeEdit ? "Ver íconos de turismo" : "Ingresar URL / personalizado"}
                  </button>
                </div>

                {!customIconModeEdit ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                    {TOURISM_EXPERIENCE_ICONS.map((p) => {
                      const IconComp = p.icon;
                      const isSelected = editImagenSello === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditImagenSello(p.id)}
                          className={`p-2.5 rounded-xl text-left border transition flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-[#7C0A1E]/10 border-[#7C0A1E] text-[#7C0A1E] font-bold shadow-2xs"
                              : "bg-white hover:bg-[#FAF8F5] border-[#E8DFD5] text-[#2D1A1E]"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#7C0A1E] text-white" : "bg-[#FAF8F5] text-[#7C0A1E]"
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-semibold leading-tight">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={editImagenSello}
                      onChange={(e) => setEditImagenSello(e.target.value)}
                      placeholder="Icono (ej: landmark, camera, sparkles) o URL de imagen"
                      className="input-base w-full text-xs font-mono"
                    />
                  </div>
                )}

                {/* Subir imagen personalizada para el sello */}
                <div className="pt-2 border-t border-[#EFE7DE] flex items-center justify-between gap-3">
                  <div className="text-[11px] text-[#8E7D7D]">
                    ¿Tienes un logo o escudo para este lugar turístico o local?
                  </div>
                  <label className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E8DFD5] text-xs font-bold text-[#7C0A1E] transition shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImg ? "Subiendo..." : "Subir Imagen"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadSelloImg}
                      disabled={uploadingImg}
                    />
                  </label>
                </div>
              </div>

              {/* Parámetros de Sellos y Puntos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2D1A1E] mb-1">
                    Meta de Sellos (Ciclo)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editMetaSellos}
                    onChange={(e) => setEditMetaSellos(Number(e.target.value))}
                    className="input-base w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2D1A1E] mb-1">
                    Puntos por Visita
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={editPuntosPorVisita}
                    onChange={(e) => setEditPuntosPorVisita(Number(e.target.value))}
                    className="input-base w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2D1A1E] mb-1">
                    Estado del Sello
                  </label>
                  <select
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value)}
                    className="input-base w-full text-xs font-semibold"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="MODERADO">Moderado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE7DE]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalEditar(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingEdit}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Guardar Cambios del Sello
            </Button>
          </div>
        </form>
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

      {/* Modal Vincular Sello Físico NFC del Local */}
      <Modal
        open={modalNfc}
        onClose={() => setModalNfc(false)}
        title="Vincular Sello Físico NFC del Local"
        size="md"
      >
        <form onSubmit={handleGuardarNfc} className="space-y-4">
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
            <Wifi className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 rotate-90" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <p className="font-bold">Sello Físico NFC para Estampado Autónomo</p>
              <p className="mt-0.5 text-emerald-800">
                Al vincular un chip NFC a <strong>"{selloSeleccionado?.establecimiento_nombre}"</strong>, los clientes que hayan olvidado su tarjeta física podrán acercar su teléfono al Sello NFC del mostrador para estampar su visita al instante.
              </p>
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
                Establecimiento: <strong className="text-[#2D1A1E]">{selloSeleccionado?.establecimiento_nombre}</strong>
              </p>
              <p className="text-[#8E7D7D] text-[11px]">
                Estado actual:{" "}
                {selloSeleccionado?.sello_nfc_uid ? (
                  <span className="font-mono font-bold text-emerald-700">
                    Vinculado ({selloSeleccionado.sello_nfc_uid})
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700">Sin chip vinculado</span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736868]">
              UID del Chip NFC del Sello
            </label>
            <input
              type="text"
              placeholder="Ej: 04:A1:B2:C3:D4:E5:67 o TOKEN-SELLO-01"
              value={nfcUidInput}
              onChange={(e) => setNfcUidInput(e.target.value.toUpperCase())}
              className="input-base font-mono uppercase text-xs w-full"
            />
            <span className="text-[10px] text-[#8E7D7D] block">
              Ingresa o escanea el UID hexadecimal del chip NFC físico ubicado en el local. Deja vacío si deseas desvincular.
            </span>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={savingNfc}
            >
              Guardar Vinculación NFC
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setModalNfc(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
