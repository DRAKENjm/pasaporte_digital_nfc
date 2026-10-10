import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Gift,
  Award,
  Sparkles,
  Plus,
  SquarePen,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  X,
  Layers,
  Package,
} from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { useUI } from "../../hooks/useUI";
import { resolveImageUrl } from "../../components/common/DigitalStampBadge";

interface RecompensaLocal {
  id_recompensa: number | string;
  id_establecimiento?: number | string;
  nombre: string;
  descripcion?: string;
  puntos_requeridos: number;
  stock?: number | null;
  stock_ilimitado?: number | boolean;
  imagen?: string | null;
  imagen_url?: string | null;
  estado: "ACTIVA" | "INACTIVA";
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  total_canjeados?: number;
}

const emptyForm = {
  nombre: "",
  descripcion: "",
  puntos_requeridos: 100,
  stock_ilimitado: true,
  stock: 20,
  imagen: "",
  estado: "ACTIVA" as "ACTIVA" | "INACTIVA",
};

export const CommerceRecompensas: React.FC = () => {
  const [recompensas, setRecompensas] = useState<RecompensaLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVA" | "INACTIVA">("TODOS");

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<RecompensaLocal | null>(null);

  // Formulario
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useUI();

  const fetchRecompensas = async () => {
    try {
      const res = await api.get("/establishments/me/recompensas");
      const data = res.data?.data || res.data || [];
      setRecompensas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error al cargar recompensas del local", e);
      showToast("No se pudieron cargar las recompensas del establecimiento", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecompensas();
  }, []);

  // Filtrado
  const recompensasFiltradas = useMemo(() => {
    return recompensas.filter((r) => {
      const matchQ =
        !q ||
        r.nombre.toLowerCase().includes(q.toLowerCase()) ||
        (r.descripcion || "").toLowerCase().includes(q.toLowerCase());
      const matchEstado = filtroEstado === "TODOS" || r.estado === filtroEstado;
      return matchQ && matchEstado;
    });
  }, [recompensas, q, filtroEstado]);

  // Métricas
  const totalActivas = useMemo(() => recompensas.filter((r) => r.estado === "ACTIVA").length, [recompensas]);
  const totalEntregados = useMemo(
    () => recompensas.reduce((acc, r) => acc + (Number(r.total_canjeados) || 0), 0),
    [recompensas]
  );

  // Handlers para modal
  const openCrear = () => {
    setForm(emptyForm);
    setErrors({});
    setModalCrear(true);
  };

  const openEditar = (r: RecompensaLocal) => {
    setRecompensaSeleccionada(r);
    const isUnlim = r.stock_ilimitado === 1 || r.stock_ilimitado === true || r.stock == null;
    setForm({
      nombre: r.nombre || "",
      descripcion: r.descripcion || "",
      puntos_requeridos: r.puntos_requeridos ?? 100,
      stock_ilimitado: isUnlim,
      stock: r.stock != null ? Number(r.stock) : 20,
      imagen: r.imagen || r.imagen_url || "",
      estado: r.estado || "ACTIVA",
    });
    setErrors({});
    setModalEditar(true);
  };

  const openEliminar = (r: RecompensaLocal) => {
    setRecompensaSeleccionada(r);
    setModalEliminar(true);
  };

  // Subida de imagen
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Selecciona un archivo de imagen válido (JPG, PNG, WEBP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen no debe superar los 5MB", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setForm((prev) => ({ ...prev, imagen: url }));
        showToast("Imagen subida con éxito", "success");
      }
    } catch {
      showToast("Error al subir la imagen. Intenta con otra.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Validar
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre del premio es obligatorio.";
    if (form.puntos_requeridos == null || form.puntos_requeridos < 0) {
      errs.puntos_requeridos = "Indica los puntos requeridos (>= 0).";
    }
    if (!form.stock_ilimitado && (form.stock == null || form.stock < 0)) {
      errs.stock = "Indica una cantidad de stock válida.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Guardar Creación
  const handleGuardarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setBusy(true);
    try {
      await api.post("/establishments/me/recompensas", {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        puntos_requeridos: Number(form.puntos_requeridos),
        stock_ilimitado: form.stock_ilimitado ? 1 : 0,
        stock: form.stock_ilimitado ? null : Number(form.stock),
        imagen: form.imagen.trim() || null,
        estado: form.estado,
      });

      showToast("¡Recompensa registrada exitosamente!", "success");
      setModalCrear(false);
      fetchRecompensas();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al registrar la recompensa.";
      showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  // Guardar Edición
  const handleGuardarEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recompensaSeleccionada || !validateForm()) return;

    setBusy(true);
    try {
      await api.put(`/establishments/me/recompensas/${recompensaSeleccionada.id_recompensa}`, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        puntos_requeridos: Number(form.puntos_requeridos),
        stock_ilimitado: form.stock_ilimitado ? 1 : 0,
        stock: form.stock_ilimitado ? null : Number(form.stock),
        imagen: form.imagen.trim() || null,
        estado: form.estado,
      });

      showToast("Recompensa actualizada correctamente", "success");
      setModalEditar(false);
      fetchRecompensas();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al actualizar la recompensa.";
      showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  // Toggle Rápido de Estado
  const handleToggleEstado = async (r: RecompensaLocal) => {
    const nuevoEstado = r.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA";
    try {
      await api.patch(`/establishments/me/recompensas/${r.id_recompensa}`, {
        estado: nuevoEstado,
      });
      setRecompensas((prev) =>
        prev.map((item) =>
          item.id_recompensa === r.id_recompensa ? { ...item, estado: nuevoEstado } : item
        )
      );
      showToast(`Recompensa marcada como ${nuevoEstado.toLowerCase()}`, "info");
    } catch {
      showToast("No se pudo cambiar el estado de la recompensa", "error");
    }
  };

  // Eliminar
  const handleConfirmarEliminar = async () => {
    if (!recompensaSeleccionada) return;
    setBusy(true);
    try {
      await api.delete(`/establishments/me/recompensas/${recompensaSeleccionada.id_recompensa}`);
      showToast("Recompensa eliminada del catálogo", "success");
      setModalEliminar(false);
      fetchRecompensas();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al eliminar la recompensa.";
      showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7C0A1E] font-semibold text-xs tracking-wider uppercase">
            <Gift className="w-4 h-4" />
            <span>Premios & Beneficios del Local</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif mt-1">Recompensas de tu Establecimiento</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Crea y administra los premios exclusivos que tus clientes podrán canjear con sus puntos acumulados
          </p>
        </div>

        <Button
          onClick={openCrear}
          className="bg-[#7C0A1E] hover:bg-[#600616] text-white rounded-2xl shadow-sm text-xs font-bold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Recompensa</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EFE7DE] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] flex items-center justify-center font-bold shrink-0">
            <Gift size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#8E7D7D] uppercase tracking-wider">Total en Catálogo</p>
            <p className="text-xl font-bold text-[#2D1A1E] mt-0.5">{recompensas.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EFE7DE] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#8E7D7D] uppercase tracking-wider">Premios Activos</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{totalActivas}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EFE7DE] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#8E7D7D] uppercase tracking-wider">Canjes Entregados</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{totalEntregados}</p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl p-3 border border-[#EFE7DE] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E7D7D]" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none focus:ring-1 focus:ring-[#7C0A1E]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto w-full sm:w-auto justify-end">
          <span className="text-xs text-[#8E7D7D] font-medium mr-1">Estado:</span>
          {(["TODOS", "ACTIVA", "INACTIVA"] as const).map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filtroEstado === est
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "bg-[#FAF8F5] border border-[#EFE7DE] text-[#8E7D7D] hover:text-[#2D1A1E]"
              }`}
            >
              {est === "TODOS" ? "Todos" : est === "ACTIVA" ? "Activas" : "Inactivas"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Recompensas */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Spinner size={32} />
          <p className="text-xs text-[#8E7D7D]">Cargando catálogo de premios de tu local...</p>
        </div>
      ) : recompensasFiltradas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#EFE7DE] text-center shadow-xs">
          <Gift className="w-12 h-12 text-[#C5A059] mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#2D1A1E]">Sin recompensas encontradas</h3>
          <p className="text-xs text-[#8E7D7D] mt-1">
            {q || filtroEstado !== "TODOS"
              ? "No hay resultados que coincidan con los filtros aplicados."
              : "Aún no has registrado ninguna recompensa para tu establecimiento."}
          </p>
          {!q && filtroEstado === "TODOS" && (
            <Button onClick={openCrear} className="mt-4 text-xs font-bold bg-[#7C0A1E] text-white px-4 py-2 rounded-xl">
              <Plus size={14} className="mr-1" />
              Crear primera recompensa
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recompensasFiltradas.map((r) => {
            const imgUrl = r.imagen_url || r.imagen;
            const isActiva = r.estado === "ACTIVA";

            return (
              <div
                key={r.id_recompensa}
                className={`bg-white rounded-3xl border shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all ${
                  isActiva ? "border-[#EFE7DE] hover:border-[#7C0A1E]/30" : "border-slate-200 opacity-80 bg-slate-50/50"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] flex items-center justify-center font-bold text-xl shadow-inner shrink-0 relative">
                      {imgUrl ? (
                        <img
                          src={resolveImageUrl(imgUrl)}
                          alt={r.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Gift className="w-8 h-8 text-[#7C0A1E]" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(r)}
                      title={`Toca para ${isActiva ? "desactivar" : "activar"}`}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer uppercase transition-all flex items-center gap-1 ${
                        isActiva
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActiva ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span>{r.estado || "ACTIVA"}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#2D1A1E] leading-snug">{r.nombre}</h3>
                    <p className="text-xs text-[#8E7D7D] mt-1 line-clamp-2">
                      {r.descripcion || "Premio canjeable para clientes fieles en este local."}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE7DE] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8E7D7D] font-medium">Puntos Requeridos</span>
                    <span className="font-black text-[#7C0A1E] flex items-center gap-1">
                      <Sparkles size={13} className="text-[#C5A059]" />
                      {r.puntos_requeridos} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8E7D7D] font-medium">Stock en Mostrador</span>
                    <span className="font-bold text-[#2D1A1E]">
                      {r.stock_ilimitado ? "Ilimitado" : `${r.stock ?? 0} unidades`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8E7D7D] font-medium">Canjes Entregados</span>
                    <span className="font-bold text-emerald-600">{r.total_canjeados ?? 0} entregados</span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#FAF8F5]">
                    <button
                      type="button"
                      onClick={() => openEditar(r)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#2D1A1E] hover:bg-[#EFE7DE] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <SquarePen size={13} className="text-[#7C0A1E]" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEliminar(r)}
                      className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Eliminar recompensa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal CREAR Recompensa */}
      <Modal
        open={modalCrear}
        onClose={() => !busy && setModalCrear(false)}
        title="Nueva Recompensa para tu Local"
      >
        <form onSubmit={handleGuardarCrear} className="space-y-4 text-left">
          <Input
            label="Nombre del Premio *"
            placeholder="Ej: Café Americano Gratis, 15% Descuento, Postre Especial..."
            value={form.nombre}
            error={errors.nombre}
            onChange={(e) => {
              setForm({ ...form, nombre: e.target.value });
              if (errors.nombre) setErrors({ ...errors, nombre: "" });
            }}
          />

          <div className="space-y-1 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Descripción del Beneficio
            </label>
            <textarea
              className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl p-2.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none focus:ring-1 focus:ring-[#7C0A1E] min-h-[70px]"
              placeholder="Detalla qué incluye el premio o condiciones de entrega..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              type="number"
              label="Puntos Requeridos *"
              placeholder="100"
              value={form.puntos_requeridos}
              error={errors.puntos_requeridos}
              onChange={(e) => {
                setForm({ ...form, puntos_requeridos: Number(e.target.value) });
                if (errors.puntos_requeridos) setErrors({ ...errors, puntos_requeridos: "" });
              }}
            />

            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tipo de Stock
              </label>
              <div className="flex bg-[#FAF8F5] p-1 rounded-xl border border-[#EFE7DE] text-xs">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, stock_ilimitado: true })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    form.stock_ilimitado
                      ? "bg-white text-[#7C0A1E] shadow-xs border border-[#EFE7DE]"
                      : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                  }`}
                >
                  Ilimitado
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, stock_ilimitado: false })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !form.stock_ilimitado
                      ? "bg-white text-[#7C0A1E] shadow-xs border border-[#EFE7DE]"
                      : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                  }`}
                >
                  Stock Fijo
                </button>
              </div>
            </div>
          </div>

          {!form.stock_ilimitado && (
            <Input
              type="number"
              label="Unidades Disponibles en Mostrador *"
              placeholder="20"
              value={form.stock}
              error={errors.stock}
              onChange={(e) => {
                setForm({ ...form, stock: Number(e.target.value) });
                if (errors.stock) setErrors({ ...errors, stock: "" });
              }}
            />
          )}

          {/* Subida de Imagen */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Foto o Imagen del Premio (Opcional)
            </label>

            <div className="flex items-center gap-3">
              {form.imagen ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EFE7DE] shrink-0 bg-slate-100">
                  <img src={resolveImageUrl(form.imagen)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imagen: "" })}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]"
                    title="Quitar foto"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#FAF8F5] border border-dashed border-[#EFE7DE] flex items-center justify-center text-[#8E7D7D] shrink-0">
                  <ImageIcon size={22} />
                </div>
              )}

              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#FAF8F5] hover:bg-[#EFE7DE] text-[#2D1A1E] border border-[#EFE7DE] text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Upload size={14} className="text-[#7C0A1E]" />
                  <span>{uploading ? "Subiendo foto..." : "Subir Foto desde dispositivo"}</span>
                </Button>
                <input
                  type="text"
                  placeholder="O pega una URL de imagen..."
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                  className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl px-3 py-1.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFE7DE]">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setModalCrear(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={busy}
              disabled={uploading}
              className="bg-[#7C0A1E] hover:bg-[#600616] text-white text-xs font-bold rounded-xl px-5"
            >
              Registrar Recompensa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal EDITAR Recompensa */}
      <Modal
        open={modalEditar}
        onClose={() => !busy && setModalEditar(false)}
        title="Editar Recompensa"
      >
        <form onSubmit={handleGuardarEditar} className="space-y-4 text-left">
          <Input
            label="Nombre del Premio *"
            placeholder="Ej: Café Americano Gratis..."
            value={form.nombre}
            error={errors.nombre}
            onChange={(e) => {
              setForm({ ...form, nombre: e.target.value });
              if (errors.nombre) setErrors({ ...errors, nombre: "" });
            }}
          />

          <div className="space-y-1 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Descripción del Beneficio
            </label>
            <textarea
              className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl p-2.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none focus:ring-1 focus:ring-[#7C0A1E] min-h-[70px]"
              placeholder="Detalla qué incluye el premio..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              type="number"
              label="Puntos Requeridos *"
              value={form.puntos_requeridos}
              error={errors.puntos_requeridos}
              onChange={(e) => {
                setForm({ ...form, puntos_requeridos: Number(e.target.value) });
                if (errors.puntos_requeridos) setErrors({ ...errors, puntos_requeridos: "" });
              }}
            />

            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estado
              </label>
              <select
                className="w-full bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl px-3 py-2 text-xs font-bold text-[#2D1A1E] focus:outline-none"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
              >
                <option value="ACTIVA">Activa (Disponible)</option>
                <option value="INACTIVA">Inactiva (Oculta)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tipo de Stock
              </label>
              <div className="flex bg-[#FAF8F5] p-1 rounded-xl border border-[#EFE7DE] text-xs">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, stock_ilimitado: true })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    form.stock_ilimitado
                      ? "bg-white text-[#7C0A1E] shadow-xs border border-[#EFE7DE]"
                      : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                  }`}
                >
                  Ilimitado
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, stock_ilimitado: false })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !form.stock_ilimitado
                      ? "bg-white text-[#7C0A1E] shadow-xs border border-[#EFE7DE]"
                      : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                  }`}
                >
                  Stock Fijo
                </button>
              </div>
            </div>

            {!form.stock_ilimitado && (
              <Input
                type="number"
                label="Unidades en Stock *"
                value={form.stock}
                error={errors.stock}
                onChange={(e) => {
                  setForm({ ...form, stock: Number(e.target.value) });
                  if (errors.stock) setErrors({ ...errors, stock: "" });
                }}
              />
            )}
          </div>

          {/* Subida de Imagen */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Foto o Imagen del Premio
            </label>

            <div className="flex items-center gap-3">
              {form.imagen ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#EFE7DE] shrink-0 bg-slate-100">
                  <img src={resolveImageUrl(form.imagen)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imagen: "" })}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]"
                    title="Quitar foto"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#FAF8F5] border border-dashed border-[#EFE7DE] flex items-center justify-center text-[#8E7D7D] shrink-0">
                  <ImageIcon size={22} />
                </div>
              )}

              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#FAF8F5] hover:bg-[#EFE7DE] text-[#2D1A1E] border border-[#EFE7DE] text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Upload size={14} className="text-[#7C0A1E]" />
                  <span>{uploading ? "Subiendo foto..." : "Cambiar Foto"}</span>
                </Button>
                <input
                  type="text"
                  placeholder="URL de imagen..."
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                  className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl px-3 py-1.5 text-xs text-[#2D1A1E] placeholder-[#8E7D7D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EFE7DE]">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setModalEditar(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={busy}
              disabled={uploading}
              className="bg-[#7C0A1E] hover:bg-[#600616] text-white text-xs font-bold rounded-xl px-5"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal CONFIRMAR ELIMINACIÓN */}
      <Modal
        open={modalEliminar}
        onClose={() => !busy && setModalEliminar(false)}
        title="Eliminar Recompensa"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#2D1A1E]">
              ¿Estás seguro de eliminar "{recompensaSeleccionada?.nombre}"?
            </h4>
            <p className="text-xs text-[#8E7D7D] mt-1">
              Esta recompensa ya no estará disponible para canjear en el catálogo de clientes.
            </p>
          </div>

          <div className="flex justify-center gap-2.5 pt-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setModalEliminar(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={busy}
              onClick={handleConfirmarEliminar}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl px-5"
            >
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
