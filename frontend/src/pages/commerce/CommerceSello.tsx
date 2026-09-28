import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";
import { getStampIcon } from "../../utils/stampIcons";
import {
  Stamp,
  Upload,
  Sparkles,
  Palette,
  CheckCircle2,
  Save,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Award,
  Plus,
  Store,
  Pencil,
  Archive,
} from "lucide-react";

// Paleta oficial de tintas notariales y de pasaportes históricos
const INK_PALETTE = [
  { name: "Borgoña Pasaporte", hex: "#7C0A1E", desc: "Tono oficial institucional" },
  { name: "Azul Notarial", hex: "#1E3A8A", desc: "Tinta clásica de certificación" },
  { name: "Verde Esmeralda", hex: "#065F46", desc: "Sello botánico / natural" },
  { name: "Café Espresso", hex: "#451A03", desc: "Tono artesanal tostado" },
  { name: "Ámbar Dorado", hex: "#B45309", desc: "Edición especial y cálida" },
  { name: "Negro Carbón", hex: "#18181B", desc: "Impresión de alta densidad" },
  { name: "Violeta Diplomático", hex: "#581C87", desc: "Distinción y elegancia" },
];

export const CommerceSello: React.FC = () => {
  const [sello, setSello] = useState<any | null>(null);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string | null>(null);
  const [sellos, setSellos] = useState<any[]>([]);
  const [insignias, setInsignias] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [estadoEdit, setEstadoEdit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingInsignia, setCreatingInsignia] = useState(false);
  const [showInsigniaForm, setShowInsigniaForm] = useState(false);
  const [nombreInsignia, setNombreInsignia] = useState("");
  const [archivoInsignia, setArchivoInsignia] = useState<File | null>(null);
  const [editingInsigniaId, setEditingInsigniaId] = useState<string | null>(null);
  const [editingInsigniaNombre, setEditingInsigniaNombre] = useState("");
  const [toggling, setToggling] = useState(false);
  const [loadError, setLoadError] = useState("");
  const busy = useRef(false);
  const pendingUploadedFilename = useRef<string | null>(null);

  // Form State
  const [nombreSello, setNombreSello] = useState("");
  const [imagenSello, setImagenSello] = useState("icon:coffee");
  const [colorSello, setColorSello] = useState("#7C0A1E");
  const [descripcion, setDescripcion] = useState("");
  const [metaSellos, setMetaSellos] = useState(8);
  const [puntosPorVisita, setPuntosPorVisita] = useState(20);

  // Interactive stamping test effect
  const [isStamping, setIsStamping] = useState(false);

  const { showToast } = useUI();

  const applyDesign = (d: any) => {
    setNombreSello(d.nombre_sello || "");
    setImagenSello(d.imagen_sello || "icon:coffee");
    setColorSello(d.color_sello || "#7C0A1E");
    setDescripcion(d.descripcion || "");
    setMetaSellos(d.meta_sellos ?? 8);
    setPuntosPorVisita(Number(d.puntos_por_visita ?? 20));
    setEstadoEdit(d.estado ?? null);
  };

  const seleccionar = (lista: any[], id: string | null, fallback: any = {}) => {
    if (id != null) {
      const found = lista.find((x) => String(x.id_programa) === id);
      if (found) {
        setSelectedId(id);
        applyDesign(found);
        return;
      }
    }
    if (lista.length > 0) {
      setSelectedId(String(lista[0].id_programa));
      applyDesign(lista[0]);
    } else {
      setSelectedId(null);
      applyDesign({ ...fallback, imagen_sello: "icon:coffee" });
    }
  };

  const branchQuery = (branchId = selectedSucursal) =>
    branchId ? `?id_sucursal=${encodeURIComponent(branchId)}` : "";

  const fetchSellos = async (branchId = selectedSucursal): Promise<any[]> => {
    const res = await api.get(`/establishments/me/sellos${branchQuery(branchId)}`);
    const lista: any[] = res.data?.data || [];
    setSellos(lista);
    return lista;
  };

  const fetchInsignias = async (branchId = selectedSucursal): Promise<any[]> => {
    const res = await api.get(`/establishments/me/insignias${branchQuery(branchId)}`);
    const lista: any[] = res.data?.data || [];
    setInsignias(lista);
    return lista;
  };

  const limpiarUploadPendiente = async () => {
    const filename = pendingUploadedFilename.current;
    if (!filename) return;
    pendingUploadedFilename.current = null;
    try {
      await api.delete(`/media/upload/${encodeURIComponent(filename)}`);
    } catch {
      // El servidor protege archivos ya vinculados; un fallo de limpieza no cancela el flujo.
    }
  };

  const seleccionarImagen = (url: string) => {
    if (pendingUploadedFilename.current && url !== imagenSello) {
      void limpiarUploadPendiente();
    }
    setImagenSello(url);
  };

  const loadSello = async (branchId?: string, forceDesignId?: string | null) => {
    setLoading(true);
    setLoadError("");
    try {
      const resSucursales = await api.get("/establishments/me/sucursales");
      const branches: any[] = resSucursales.data?.data || [];
      setSucursales(branches);
      const branchStillAssigned = branches.some((s) => String(s.id_sucursal) === selectedSucursal);
      const targetBranch = branchId || (branchStillAssigned ? selectedSucursal : String(branches[0]?.id_sucursal || ""));
      if (!targetBranch) throw new Error("No tienes una sucursal activa asignada");
      setSelectedSucursal(targetBranch);
      const suffix = branchQuery(targetBranch);
      const [lista, resPrincipal] = await Promise.all([
        fetchSellos(targetBranch),
        api.get(`/establishments/me/sello${suffix}`),
        fetchInsignias(targetBranch),
      ]);
      const principal = resPrincipal.data?.data || null;
      setSello(principal);
      const idToSelect = forceDesignId === undefined ? selectedId : forceDesignId;
      seleccionar(lista, idToSelect, principal);
    } catch (e: any) {
      setSello(null);
      setLoadError(e.response?.data?.message || "No se pudo cargar tus sellos digitales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSello();
  }, []);

  useEffect(() => () => {
    const filename = pendingUploadedFilename.current;
    if (!busy.current && filename) {
      void api.delete(`/media/upload/${encodeURIComponent(filename)}`).catch(() => {});
    }
  }, []);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || busy.current || !sello) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) {
      showToast("Usa una imagen JPG, PNG, WebP, GIF o AVIF", "error");
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      showToast("La imagen debe tener contenido y pesar como máximo 5 MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    busy.current = true;
    setUploading(true);
    try {
      const { data } = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.url || data?.url;
      const filename = data?.data?.filename || data?.filename;
      if (typeof url !== "string" || !/^https?:\/\//.test(url) || url.length > 255) {
        throw new Error("El servidor no devolvió una URL de imagen válida para el sello");
      }
      const previousFilename = pendingUploadedFilename.current;
      pendingUploadedFilename.current = typeof filename === "string" ? filename : null;
      if (previousFilename && previousFilename !== filename) {
        void api.delete(`/media/upload/${encodeURIComponent(previousFilename)}`).catch(() => {});
      }
      setImagenSello(url);
      showToast("Imagen subida. Pulsa Guardar Diseño de Sello para aplicarla.", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || "No se pudo subir la imagen", "error");
    } finally {
      busy.current = false;
      setUploading(false);
    }
  };

  const handleCreateInsignia = async () => {
    if (busy.current || !sello) return;
    if (!nombreInsignia.trim() || nombreInsignia.trim().length > 80) {
      showToast("Escribe un nombre de hasta 80 caracteres", "error");
      return;
    }
    if (!archivoInsignia) {
      showToast("Selecciona la imagen de la insignia", "error");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(archivoInsignia.type)) {
      showToast("Usa una imagen JPG, PNG, WebP, GIF o AVIF", "error");
      return;
    }
    if (archivoInsignia.size === 0 || archivoInsignia.size > 5 * 1024 * 1024) {
      showToast("La imagen debe tener contenido y pesar como máximo 5 MB", "error");
      return;
    }

    busy.current = true;
    setCreatingInsignia(true);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", archivoInsignia);
      const uploaded = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = uploaded.data?.data?.url || uploaded.data?.url;
      const filename = uploaded.data?.data?.filename || uploaded.data?.filename;
      if (typeof url !== "string" || !/^https?:\/\//.test(url) || url.length > 255) {
        throw new Error("El servidor no devolvió una URL de imagen válida");
      }
      pendingUploadedFilename.current = typeof filename === "string" ? filename : null;

      await api.post("/establishments/me/insignias", {
        nombre: nombreInsignia.trim(),
        imagen_url: url,
        id_sucursal: selectedSucursal,
      });
      pendingUploadedFilename.current = null;
      await fetchInsignias();
      setImagenSello(url);
      setNombreInsignia("");
      setArchivoInsignia(null);
      setShowInsigniaForm(false);
      showToast("Insignia guardada y seleccionada. Guarda el diseño para aplicarla.", "success");
    } catch (error: any) {
      await limpiarUploadPendiente();
      showToast(error.response?.data?.message || error.message || "No se pudo crear la insignia", "error");
    } finally {
      busy.current = false;
      setCreatingInsignia(false);
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current || !sello) return;
    if (!nombreSello.trim() || nombreSello.trim().length > 100) {
      showToast("Ingresa un nombre de hasta 100 caracteres para el sello", "error");
      return;
    }
    if (descripcion.trim().length > 255 || !/^#[0-9a-f]{6}$/i.test(colorSello)) {
      showToast("Revisa la descripción (máximo 255 caracteres) y el color del sello", "error");
      return;
    }
    if (!Number.isInteger(metaSellos) || metaSellos < 4 || metaSellos > 20) {
      showToast("La meta debe ser un número entero entre 4 y 20 sellos", "error");
      return;
    }

    busy.current = true;
    setSaving(true);
    try {
      const payload = {
        nombre_sello: nombreSello.trim(),
        imagen_sello: imagenSello.trim(),
        color_sello: colorSello.trim(),
        descripcion: descripcion.trim(),
        meta_sellos: Number(metaSellos),
      };
      if (selectedId == null) {
        const res = await api.post("/establishments/me/sellos", { ...payload, id_sucursal: selectedSucursal });
        pendingUploadedFilename.current = null;
        const nuevoId = res.data?.data?.id_programa;
        const lista = await fetchSellos();
        seleccionar(lista, nuevoId != null ? String(nuevoId) : null);
        showToast("¡Nuevo sello creado y activo para tus clientes!", "success");
      } else {
        await api.put(`/establishments/me/sellos/${selectedId}${branchQuery()}`, payload);
        pendingUploadedFilename.current = null;
        await fetchSellos();
        showToast("¡Diseño de sello guardado exitosamente!", "success");
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || "Error al guardar el sello", "error");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleSelect = (d: any) => {
    if (busy.current || saving || uploading || toggling) return;
    if (pendingUploadedFilename.current) void limpiarUploadPendiente();
    setSelectedId(String(d.id_programa));
    applyDesign(d);
  };

  const handleNuevo = () => {
    if (busy.current || saving || uploading || toggling) return;
    if (pendingUploadedFilename.current) void limpiarUploadPendiente();
    setSelectedId(null);
    applyDesign({});
  };

  const handleToggleEstado = async (d: any) => {
    if (busy.current || toggling) return;
    const nuevo = d.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    busy.current = true;
    setToggling(true);
    try {
      await api.patch(`/establishments/me/sellos/${d.id_programa}/estado${branchQuery()}`, { estado: nuevo });
      const lista = await fetchSellos();
      if (selectedId != null) {
        const found = lista.find((x) => String(x.id_programa) === selectedId);
        if (found) setEstadoEdit(found.estado);
      }
      showToast(nuevo === "ACTIVO" ? "Sello activado" : "Sello desactivado", "success");
    } catch (e: any) {
      showToast(e.response?.data?.message || "No se pudo cambiar el estado del sello", "error");
    } finally {
      busy.current = false;
      setToggling(false);
    }
  };

  const handleRenameInsignia = async (item: any) => {
    if (busy.current) return;
    if (editingInsigniaId !== String(item.id_insignia)) {
      setEditingInsigniaId(String(item.id_insignia));
      setEditingInsigniaNombre(item.nombre);
      return;
    }
    if (!editingInsigniaNombre.trim() || editingInsigniaNombre.trim().length > 80) {
      showToast("El nombre admite hasta 80 caracteres", "error");
      return;
    }
    busy.current = true;
    try {
      await api.put(`/establishments/me/insignias/${item.id_insignia}${branchQuery()}`, {
        nombre: editingInsigniaNombre.trim(),
      });
      await fetchInsignias();
      setEditingInsigniaId(null);
      showToast("Nombre actualizado", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "No se pudo renombrar la insignia", "error");
    } finally {
      busy.current = false;
    }
  };

  const handleArchiveInsignia = async (item: any) => {
    if (busy.current) return;
    const active = item.estado === "ACTIVO";
    if (active && !window.confirm(`¿Archivar "${item.nombre}"? Los diseños que ya la usan no cambiarán.`)) return;
    busy.current = true;
    try {
      await api.patch(`/establishments/me/insignias/${item.id_insignia}/estado${branchQuery()}`, {
        estado: active ? "INACTIVO" : "ACTIVO",
      });
      await fetchInsignias();
      showToast(active ? "Insignia archivada" : "Insignia restaurada", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "No se pudo actualizar la insignia", "error");
    } finally {
      busy.current = false;
    }
  };

  const handleSucursalChange = (idSucursal: string) => {
    if (!idSucursal || idSucursal === selectedSucursal || busy.current) return;
    if (pendingUploadedFilename.current) void limpiarUploadPendiente();
    setSelectedSucursal(idSucursal);
    setSelectedId(null);
    void loadSello(idSucursal, null);
  };

  const triggerStampAnimation = () => {
    setIsStamping(true);
    setTimeout(() => {
      setIsStamping(false);
    }, 600);
  };

  const establecimientosDisponibles = Array.from(
    new Map(sucursales.map((s) => [String(s.id_establecimiento), s])).values(),
  );

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <Spinner size={36} />
        <p className="text-xs text-[#8E7D7D]">Cargando taller de sellos digitales...</p>
      </div>
    );
  }

  if (loadError) return (
    <div role="alert" className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-[#EFE7DE] space-y-4">
      <h1 className="text-xl font-bold text-[#2D1A1E]">Mi Sello Digital</h1>
      <p className="text-sm text-[#8E7D7D]">{loadError}</p>
      <Button onClick={() => void loadSello()}>Reintentar</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] flex items-center justify-center font-bold shadow-xs">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">
                Mi Sello Digital
              </h1>
              <p className="text-xs text-[#8E7D7D]">
                Personaliza la insignia que se estampará en el pasaporte de tus clientes al validar su visita
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {establecimientosDisponibles.length > 1 && (
            <label className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3 py-2 rounded-2xl shadow-2xs text-xs">
              <Store className="w-4 h-4 text-[#7C0A1E]" />
              <span className="sr-only">Establecimiento del diseño</span>
              <select
                value={selectedSucursal || ""}
                disabled={loading || saving || uploading || toggling}
                onChange={(e) => handleSucursalChange(e.target.value)}
                className="max-w-44 bg-transparent border-none focus:outline-none font-bold text-xs"
              >
                {establecimientosDisponibles.map((s) => (
                  <option key={s.id_establecimiento} value={s.id_sucursal}>
                    {s.nombre_comercial}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3.5 py-1.5 rounded-2xl shadow-2xs text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-[#2D1A1E]">
            {sello?.establecimiento_nombre || "Establecimiento"}
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
            {sellos.reduce((acc, d) => acc + (Number(d.total_sellos_otorgados) || 0), 0)} otorgados
          </span>
          </div>
        </div>
      </div>

      {/* Mis diseños de sello */}
      <div className="bg-white rounded-3xl p-5 border border-[#EFE7DE] shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#2D1A1E] uppercase tracking-wider flex items-center gap-2">
              <Stamp className="w-4 h-4 text-[#7C0A1E]" />
              Mis diseños de sello
            </h3>
            <p className="text-[11px] text-[#8E7D7D]">
              {sellos.length} diseño{sellos.length === 1 ? "" : "s"} ·{" "}
              {sellos.filter((d) => d.estado === "ACTIVO").length} activo(s) disponible(s) para validar visitas
            </p>
          </div>
          <button
            type="button"
            onClick={handleNuevo}
            disabled={saving || uploading || toggling}
            className="px-4 py-2.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nuevo diseño
          </button>
        </div>

        {sellos.length === 0 ? (
          <p className="text-xs text-[#8E7D7D] bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-4">
            Aún no tienes diseños guardados. Crea el primero con "Nuevo diseño" y pulsa Crear Sello:
            quedará activo para que tus clientes lo reciban al validar su visita.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sellos.map((d) => {
              const activo = d.estado === "ACTIVO";
              const sel = selectedId === String(d.id_programa);
              const esImagen =
                typeof d.imagen_sello === "string" && /^(https?:\/\/|\/)/.test(d.imagen_sello);
              return (
                <div
                  key={d.id_programa}
                  onClick={() => handleSelect(d)}
                  className={`rounded-2xl border p-3 transition-all cursor-pointer ${
                    sel
                      ? "border-[#7C0A1E] bg-rose-50/50 ring-2 ring-[#7C0A1E]/20"
                      : "border-[#EFE7DE] hover:border-slate-300 bg-white"
                  } ${activo ? "" : "opacity-75"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center overflow-hidden shrink-0">
                      {esImagen ? (
                        <img src={d.imagen_sello} alt="" className="w-7 h-7 object-contain" />
                      ) : (() => {
                        const StampIcon = getStampIcon(d.imagen_sello);
                        return StampIcon ? (
                          <StampIcon
                            className="w-5 h-5"
                            style={{ color: d.color_sello || "#7C0A1E" }}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <span className="text-xl">{d.imagen_sello || "☕"}</span>
                        );
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2D1A1E] truncate">
                        {d.nombre_sello || "Sello"}
                      </p>
                      <p className="text-[10px] text-[#8E7D7D]">
                        meta {d.meta_sellos} · {Number(d.total_sellos_otorgados) || 0} otorgados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        activo
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {activo ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      type="button"
                      disabled={toggling || saving || uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleEstado(d);
                      }}
                      className="text-[10px] font-bold text-[#7C0A1E] hover:underline disabled:opacity-50"
                    >
                      {activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Panel de Diseño / Formulario */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-xs space-y-6">
          <div className="border-b border-[#EFE7DE] pb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#2D1A1E] uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#7C0A1E]" />
              {selectedId == null ? "Nuevo diseño de sello" : "Atributos del Sello"}
            </h3>
            <span className="flex items-center gap-2 text-[11px] text-[#8E7D7D]">
              {selectedId == null
                ? "Se creará como sello nuevo"
                : estadoEdit === "INACTIVO"
                ? "Editando sello inactivo"
                : "Edición en vivo"}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <fieldset disabled={saving || uploading} className="space-y-5 min-w-0">
            {/* 1. Nombre del Sello */}
            <div>
              <Input
                label="Nombre del Sello *"
                placeholder="Ej. Sello Aroma Café"
                value={nombreSello}
                onChange={(e) => setNombreSello(e.target.value)}
                required
                maxLength={100}
              />
              <span className="text-[11px] text-[#8E7D7D] block mt-1">
                Aparecerá en el registro de visitas y sellos coleccionados del cliente.
              </span>
            </div>

            {/* 2. Lema o Descripción */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Lema o Leyenda de Visita
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="Ej. Pasaporte Cafetero · Calidad de Origen"
                value={descripcion}
                maxLength={255}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <span className="text-[11px] text-[#8E7D7D] block mt-1">
                Mensaje conmemorativo que acompaña la acreditación del sello.
              </span>
            </div>

            {/* 3. Selección de Color de Tinta Digital */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-2">
                Color de Tinta Digital (Tono de Estampado)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INK_PALETTE.map((ink) => (
                  <button
                    key={ink.hex}
                    type="button"
                    onClick={() => setColorSello(ink.hex)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      colorSello.toLowerCase() === ink.hex.toLowerCase()
                        ? "border-[#7C0A1E] bg-[#FAF8F5] shadow-xs ring-2 ring-[#7C0A1E]/20"
                        : "border-[#EFE7DE] hover:border-slate-300"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-inner border border-black/10"
                      style={{ backgroundColor: ink.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#2D1A1E] truncate">{ink.name}</p>
                      <p className="text-[9px] text-[#8E7D7D] font-mono">{ink.hex}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selector personalizado */}
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={colorSello}
                  onChange={(e) => setColorSello(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#EFE7DE]"
                />
                <span className="text-xs text-[#8E7D7D]">
                  O elige un color personalizado: <strong className="font-mono text-[#2D1A1E]">{colorSello}</strong>
                </span>
              </div>
            </div>

            {/* 4. Insignia o Icono del Sello */}
            <div className="space-y-3 pt-2 border-t border-[#EFE7DE]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868]">
                  Insignia Central del Sello
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInsigniaForm((open) => !open)}
                    disabled={uploading || saving}
                    className="text-xs font-bold text-[#7C0A1E] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showInsigniaForm ? "Cerrar creador" : "Crear insignia"}</span>
                  </button>
                  <label className="cursor-pointer text-xs font-bold text-[#7C0A1E] hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir para este diseño</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                  </label>
                </div>
              </div>

              <p className="text-[11px] text-[#8E7D7D]">Crea insignias propias para guardarlas en la biblioteca de tu local y reutilizarlas en tus diseños. También puedes subir una imagen solo para este diseño. Máximo 5 MB.</p>

              {showInsigniaForm && (
                <div className="rounded-2xl border border-[#C5A059]/40 bg-amber-50/50 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-[#2D1A1E]">Crear insignia reutilizable</p>
                    <p className="text-[11px] text-[#8E7D7D] mt-0.5">Se guardará en la biblioteca de tu local para usarla en otros diseños.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-[11px] font-semibold text-[#736868] space-y-1">
                      <span>Nombre de la insignia *</span>
                      <input
                        type="text"
                        value={nombreInsignia}
                        onChange={(e) => setNombreInsignia(e.target.value)}
                        maxLength={80}
                        placeholder="Ej. Café de especialidad"
                        className="input-base text-xs"
                      />
                    </label>
                    <label className="text-[11px] font-semibold text-[#736868] space-y-1">
                      <span>Imagen (JPG, PNG, WebP, GIF o AVIF) *</span>
                      <input
                        key={archivoInsignia ? `${archivoInsignia.name}-${archivoInsignia.lastModified}` : "new-insignia-file"}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={(e) => setArchivoInsignia(e.target.files?.[0] || null)}
                        className="block w-full text-[11px] text-[#736868] file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-[#7C0A1E]"
                      />
                    </label>
                  </div>
                  {archivoInsignia && (
                    <p className="text-[10px] text-[#8E7D7D] truncate">Seleccionada: {archivoInsignia.name}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleCreateInsignia()}
                    disabled={creatingInsignia || !nombreInsignia.trim() || !archivoInsignia}
                    className="px-4 py-2 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingInsignia ? <Spinner size={14} /> : <Save className="w-3.5 h-3.5" />}
                    Guardar insignia en mi biblioteca
                  </button>
                </div>
              )}

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-[#7C0A1E] bg-rose-50 p-2.5 rounded-xl border border-[#7C0A1E]/20">
                  <Spinner size={16} />
                  <span>Subiendo recurso gráfico...</span>
                </div>
              )}

              {insignias.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#736868]">Mis insignias</p>
                    <span className="text-[10px] text-[#8E7D7D]">Guardadas para reutilizar</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {insignias.map((item) => {
                      const archived = item.estado === "INACTIVO";
                      const editing = editingInsigniaId === String(item.id_insignia);
                      return (
                        <div
                          key={item.id_insignia}
                          className={`rounded-xl border p-2 space-y-2 ${archived ? "border-slate-200 bg-slate-50 opacity-75" : imagenSello === item.imagen_url ? "border-[#7C0A1E] bg-rose-50 ring-2 ring-[#7C0A1E]/20" : "border-[#EFE7DE]"}`}
                        >
                          <div className="w-full flex items-center gap-2">
                            <img src={item.imagen_url} alt="" className="w-9 h-9 rounded-lg object-contain bg-white shrink-0" />
                            {editing ? (
                              <input
                                type="text"
                                value={editingInsigniaNombre}
                                onChange={(e) => setEditingInsigniaNombre(e.target.value)}
                                maxLength={80}
                                aria-label="Nombre de insignia"
                                className="input-base min-w-0 py-1 text-[10px]"
                              />
                            ) : (
                              <button
                                type="button"
                                disabled={archived}
                                onClick={() => seleccionarImagen(item.imagen_url)}
                                className="min-w-0 flex-1 truncate text-left text-[10px] font-semibold text-[#2D1A1E] disabled:cursor-not-allowed"
                                title={archived ? "Insignia archivada" : `Usar ${item.nombre}`}
                              >
                                {item.nombre}{archived && <span className="ml-1 text-[9px] text-slate-500">· archivada</span>}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-end gap-3 border-t border-[#EFE7DE] pt-1.5">
                            <button
                              type="button"
                              disabled={archived || uploading || saving}
                              onClick={() => void handleRenameInsignia(item)}
                              className="text-[9px] font-bold text-[#7C0A1E] hover:underline disabled:opacity-50"
                            >
                              {editing ? "Guardar nombre" : "Renombrar"}
                            </button>
                            {editing && (
                              <button type="button" onClick={() => setEditingInsigniaId(null)} className="text-[9px] text-[#8E7D7D] hover:underline">
                                Cancelar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={uploading || saving}
                              onClick={() => void handleArchiveInsignia(item)}
                              className="text-[9px] font-bold text-[#8E7D7D] hover:underline disabled:opacity-50"
                            >
                              {archived ? "Restaurar" : "Archivar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {imagenSello.startsWith("http") && (
                <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-[#EFE7DE] text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <img src={imagenSello} alt="Logo" className="w-11 h-11 rounded-full object-contain" />
                    <span className="text-muted truncate text-[11px] font-mono">Logo personalizado cargado</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => seleccionarImagen("icon:coffee")}
                    className="text-xs text-rose-600 hover:underline font-bold shrink-0 ml-2"
                  >
                    Restablecer
                  </button>
                </div>
              )}
            </div>

            {/* 5. Meta de sellos del ciclo */}
            <div className="pt-2 border-t border-[#EFE7DE]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Meta de Sellos por Ciclo de Pasaporte
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="4"
                  max="20"
                  step="1"
                  required
                  value={metaSellos}
                  onChange={(e) => setMetaSellos(Number(e.target.value))}
                  className="input-base w-32 font-bold text-center"
                />
                <span className="text-xs text-[#8E7D7D]">
                  sellos para que el cliente complete una ronda y desbloquee recompensas exclusivas
                </span>
              </div>
            </div>

            {/* Botón de Guardado */}
            <div className="pt-4 flex items-center gap-3">
              <Button type="submit" loading={saving} disabled={uploading} className="px-6 py-2.5 text-xs font-bold">
                <Save className="w-4 h-4 mr-2" />
                {selectedId == null ? "Crear Sello" : "Guardar Diseño de Sello"}
              </Button>
              <button
                type="button"
                onClick={triggerStampAnimation}
                className="px-4 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-bold text-[#2D1A1E] hover:bg-[#FAF8F5] transition active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Simular Estampado</span>
              </button>
            </div>
            </fieldset>
          </form>
        </div>

        {/* Columna Derecha: Vista Previa en Pasaporte del Cliente */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#EFE7DE]/50 border border-[#EFE7DE] p-4 rounded-3xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-[#7C0A1E] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Vista Previa en el Pasaporte
              </span>
              <span className="text-[10px] font-bold text-[#8E7D7D] bg-white px-2 py-0.5 rounded-full border border-[#EFE7DE]">
                Web App del Cliente
              </span>
            </div>

            {/* Hoja de Pasaporte Vintage con Fondo Crema y Filigranas */}
            <div className="relative bg-[#FAF8F5] border-2 border-[#D8C7B5] rounded-3xl p-6 shadow-md overflow-hidden min-h-[460px] flex flex-col justify-between">
              {/* Filigrana de pasaporte y guilloché */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, #7C0A1E 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#C5A059] via-[#7C0A1E] to-[#C5A059]" />

              {/* Header de la página del pasaporte */}
              <div className="relative z-10 flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-[10px] text-[#8E7D7D] font-mono uppercase tracking-widest">
                <span>PASAPORTE DIGITAL · REPÚBLICA</span>
                <span>PÁG. 04</span>
              </div>

              {/* Sello Estampado Central */}
              <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center">
                <div
                  className={`transition-all duration-500 transform ${
                    isStamping ? "scale-125 opacity-40 blur-xs" : "scale-100 opacity-100"
                  }`}
                >
                  <DigitalStampBadge
                    nombre_sello={nombreSello}
                    establecimiento_nombre={sello?.establecimiento_nombre || "Establecimiento"}
                    imagen_sello={imagenSello}
                    color_sello={colorSello}
                    numero_sello={1}
                    fecha={new Date()}
                    size="xxl"
                    rotation={-4}
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-bold text-[#2D1A1E]">
                    {nombreSello || "Sello Comercial"}
                  </p>
                  <p className="text-[11px] text-[#8E7D7D] italic mt-0.5 max-w-xs">
                    "{descripcion || "Visita confirmada en establecimiento afiliado"}"
                  </p>
                </div>
              </div>

              {/* Pie de página con código de autenticidad */}
              <div className="relative z-10 border-t border-[#E8DFD5] pt-2 flex items-center justify-between text-[9px] text-[#8E7D7D] font-mono">
                <span>NFC-VALIDATED · +{puntosPorVisita} PTS</span>
                <span>ID: #SELLO-VRF-2026</span>
              </div>
            </div>
          </div>

          {/* Tarjeta explicativa para el comercio */}
          <div className="bg-white rounded-3xl p-5 border border-[#EFE7DE] shadow-2xs space-y-2.5 text-xs text-[#8E7D7D]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#2D1A1E] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                ¿Cómo funciona el Sello Digital?
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                +{puntosPorVisita} pts / visita
              </span>
            </div>
            <p>
              Cada vez que acerques la tarjeta NFC de un cliente a tu terminal o registres su visita, este sello se estampará automáticamente en su pasaporte digital personal junto con los <strong>+{puntosPorVisita} puntos</strong> configurados para este diseño.
            </p>
            <p className="text-[11px]">
              Al completar los <strong>{metaSellos} sellos</strong> requeridos, tu cliente completará este ciclo y acumulará puntos para canjear recompensas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
