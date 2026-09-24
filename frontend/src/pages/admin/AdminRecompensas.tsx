import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { Recompensa, CanjeHistorial } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  Plus,
  SquarePen,
  Trash,
  Gift,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Coins,
  Package,
  Truck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Check,
  User as UserIcon,
  ShoppingBag,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  nombre_recompensa: "",
  descripcion: "",
  costo_puntos_globales: 100,
  stock_disponible: 10,
  tipo_entrega: "OFICINA_CENTRAL",
  direccion_recojo: "",
  imagen_url: "",
  estado: "ACTIVA",
};

export const AdminRecompensas: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "CANJES">("CATALOGO");

  // Estado Catálogo
  const [list, setList] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  // Estado Canjes
  const [canjes, setCanjes] = useState<CanjeHistorial[]>([]);
  const [loadingCanjes, setLoadingCanjes] = useState(false);
  const [qCanjes, setQCanjes] = useState("");
  const [filtroCanjes, setFiltroCanjes] = useState("TODOS");
  const [paginaCanjes, setPaginaCanjes] = useState(1);

  // Modales Catálogo
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [recompensaSeleccionada, setRecompensaSeleccionada] =
    useState<Recompensa | null>(null);

  // Modal Canjes
  const [modalVerCanje, setModalVerCanje] = useState(false);
  const [canjeSeleccionado, setCanjeSeleccionado] = useState<CanjeHistorial | null>(null);
  const [modalAccionCanje, setModalAccionCanje] = useState<{
    canje: CanjeHistorial;
    nuevoEstado: "ENTREGADO" | "CANCELADO";
  } | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { showToast } = useUI();

  // Detectar query params por si viene de una notificación (?tab=canjes)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "canjes") {
      setActiveTab("CANJES");
    }
  }, [location.search]);

  const loadCatalogo = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/recompensas");
      const rows = data?.data ?? data ?? [];
      setList(Array.isArray(rows) ? rows : []);
    } catch {
      showToast("No se pudieron cargar las recompensas", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCanjes = async () => {
    setLoadingCanjes(true);
    try {
      const { data } = await api.get("/admin/canjes");
      const rows = data?.data ?? data ?? [];
      setCanjes(Array.isArray(rows) ? rows : []);
    } catch {
      showToast("No se pudieron cargar las solicitudes de canje", "error");
    } finally {
      setLoadingCanjes(false);
    }
  };

  useEffect(() => {
    loadCatalogo();
    loadCanjes();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [q, filtroEstado]);

  useEffect(() => {
    setPaginaCanjes(1);
  }, [qCanjes, filtroCanjes]);

  // Filtrado de Catálogo
  const listFiltrado = useMemo(() => {
    let result = list;
    if (filtroEstado !== "TODOS") {
      result = result.filter((r) => r.estado === filtroEstado);
    }
    if (q.trim()) {
      const ql = q.toLowerCase();
      result = result.filter(
        (r) =>
          r.nombre_recompensa?.toLowerCase().includes(ql) ||
          r.descripcion?.toLowerCase().includes(ql),
      );
    }
    return result;
  }, [list, filtroEstado, q]);

  const totalPaginas = Math.max(1, Math.ceil(listFiltrado.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const listPaginado = listFiltrado.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  // Filtrado de Canjes
  const canjesFiltrados = useMemo(() => {
    let result = canjes;
    if (filtroCanjes !== "TODOS") {
      result = result.filter((c) => c.estado_entrega === filtroCanjes);
    }
    if (qCanjes.trim()) {
      const ql = qCanjes.toLowerCase();
      result = result.filter(
        (c) =>
          c.usuario_nombre?.toLowerCase().includes(ql) ||
          c.usuario_email?.toLowerCase().includes(ql) ||
          c.nombre_recompensa?.toLowerCase().includes(ql),
      );
    }
    return result;
  }, [canjes, filtroCanjes, qCanjes]);

  const totalPaginasCanjes = Math.max(1, Math.ceil(canjesFiltrados.length / ITEMS_PER_PAGE));
  const paginaActualCanjes = Math.min(paginaCanjes, totalPaginasCanjes);
  const canjesPaginados = canjesFiltrados.slice(
    (paginaActualCanjes - 1) * ITEMS_PER_PAGE,
    paginaActualCanjes * ITEMS_PER_PAGE,
  );

  const canjesPendientesCount = useMemo(() => {
    return canjes.filter((c) => c.estado_entrega === "PENDIENTE_RECOJO").length;
  }, [canjes]);

  // Handlers Catálogo
  const openCrear = () => {
    setForm(emptyForm);
    setErrors({});
    setModalCrear(true);
  };

  const openEditar = (r: Recompensa) => {
    setRecompensaSeleccionada(r);
    setForm({
      nombre_recompensa: r.nombre_recompensa,
      descripcion: r.descripcion ?? "",
      costo_puntos_globales: r.costo_puntos_globales,
      stock_disponible: r.stock_disponible ?? 0,
      tipo_entrega: r.tipo_entrega ?? "OFICINA_CENTRAL",
      direccion_recojo: r.direccion_recojo ?? "",
      imagen_url: r.imagen_url ?? "",
      estado: r.estado ?? "ACTIVA",
    });
    setErrors({});
    setModalEditar(true);
  };

  const openVer = (r: Recompensa) => {
    setRecompensaSeleccionada(r);
    setModalVer(true);
  };

  const openEliminar = (r: Recompensa) => {
    setRecompensaSeleccionada(r);
    setModalEliminar(true);
  };

  const validate = (data: typeof emptyForm): boolean => {
    const e: Record<string, string> = {};
    if (!data.nombre_recompensa.trim()) {
      e.nombre_recompensa = "El nombre es obligatorio";
    }
    if (!data.costo_puntos_globales || data.costo_puntos_globales < 1) {
      e.costo_puntos_globales = "El costo debe ser mayor a 0";
    }
    if (data.stock_disponible === undefined || data.stock_disponible < 0) {
      e.stock_disponible = "El stock no puede ser negativo";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;
    setBusy(true);
    try {
      await api.post("/admin/recompensas", form);
      showToast("Recompensa creada exitosamente", "success");
      setModalCrear(false);
      await loadCatalogo();
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo crear la recompensa", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recompensaSeleccionada) return;
    if (!validate(form)) return;
    setBusy(true);
    try {
      await api.patch(`/admin/recompensas/${recompensaSeleccionada.id}`, form);
      showToast("Recompensa actualizada exitosamente", "success");
      setModalEditar(false);
      await loadCatalogo();
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo actualizar", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEliminar = async () => {
    if (!recompensaSeleccionada) return;
    setBusy(true);
    try {
      await api.delete(`/admin/recompensas/${recompensaSeleccionada.id}`);
      showToast("Recompensa eliminada", "success");
      setModalEliminar(false);
      await loadCatalogo();
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo eliminar", "error");
    } finally {
      setBusy(false);
    }
  };

  // Handlers Canjes
  const handleCambiarEstadoCanje = async () => {
    if (!modalAccionCanje) return;
    setBusy(true);
    try {
      await api.patch(`/admin/canjes/${modalAccionCanje.canje.id}/estado`, {
        estado_entrega: modalAccionCanje.nuevoEstado,
      });
      showToast(
        modalAccionCanje.nuevoEstado === "ENTREGADO"
          ? "Canje marcado como Entregado con éxito"
          : "Canje cancelado y puntos reembolsados al usuario",
        "success",
      );
      setModalAccionCanje(null);
      await Promise.all([loadCanjes(), loadCatalogo()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo actualizar el estado del canje", "error");
    } finally {
      setBusy(false);
    }
  };

  const formRecompensa = (
    <form
      onSubmit={(e) => (modalCrear ? handleCrear(e) : handleEditar(e))}
      className="space-y-4"
    >
      <Input
        label="Nombre de la Recompensa *"
        placeholder="Ej: Mochila Viajera, Botella Térmica, 2x1 en Café..."
        value={form.nombre_recompensa}
        required
        error={errors.nombre_recompensa}
        onChange={(e) => {
          setForm({ ...form, nombre_recompensa: e.target.value });
          if (errors.nombre_recompensa)
            setErrors({ ...errors, nombre_recompensa: "" });
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          label="Costo en Puntos Globales *"
          type="number"
          min={1}
          value={form.costo_puntos_globales}
          error={errors.costo_puntos_globales}
          onChange={(e) => {
            setForm({
              ...form,
              costo_puntos_globales: Number(e.target.value),
            });
            if (errors.costo_puntos_globales)
              setErrors({ ...errors, costo_puntos_globales: "" });
          }}
        />
        <Input
          label="Stock Disponible *"
          type="number"
          min={0}
          value={form.stock_disponible}
          error={errors.stock_disponible}
          onChange={(e) => {
            setForm({
              ...form,
              stock_disponible: Number(e.target.value),
            });
            if (errors.stock_disponible)
              setErrors({ ...errors, stock_disponible: "" });
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Modalidad de entrega
          </label>
          <select
            className="input-base text-xs w-full py-2.5"
            value={form.tipo_entrega}
            onChange={(e) => setForm({ ...form, tipo_entrega: e.target.value })}
          >
            <option value="OFICINA_CENTRAL">Oficina Central (Presencial)</option>
            <option value="RETIRO_LOCAL">Retiro en Local Aliado</option>
            <option value="ENVIO">Envío a Domicilio</option>
          </select>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estado de publicación
          </label>
          <select
            className="input-base text-xs w-full py-2.5"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          >
            <option value="ACTIVA">Activa (Disponible)</option>
            <option value="INACTIVA">Inactiva (Oculta)</option>
            <option value="AGOTADA">Agotada</option>
          </select>
        </div>
      </div>

      <Input
        label="Dirección o Punto de Recojo"
        placeholder="Ej: Av. Larco 1234, Of. 402, Miraflores..."
        value={form.direccion_recojo}
        onChange={(e) => setForm({ ...form, direccion_recojo: e.target.value })}
      />

      <Input
        label="URL de Imagen (Opcional)"
        placeholder="https://images.unsplash.com/..."
        value={form.imagen_url}
        onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
      />

      {form.imagen_url && (
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <img
            src={form.imagen_url}
            alt="Vista previa"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="space-y-1.5 w-full text-left">
        <div className="flex items-center justify-between">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Descripción o términos del canje
          </span>
          <span className="text-[11px] text-slate-400">
            {form.descripcion.length} caracteres
          </span>
        </div>
        <textarea
          className="input-base min-h-[90px] w-full resize-y text-xs leading-relaxed"
          rows={3}
          placeholder="Especifica condiciones, tallas o instrucciones para que el cliente reclame el beneficio..."
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => {
            setModalCrear(false);
            setModalEditar(false);
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={busy} fullWidth>
          {modalCrear ? "Crear recompensa" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <Gift className="w-4 h-4" />
            <span>Fidelización & Recompensas</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Gestión de recompensas y canjes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administra el catálogo de premios y el despacho de solicitudes realizadas por los usuarios
          </p>
        </div>

        {activeTab === "CATALOGO" && (
          <Button
            onClick={openCrear}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs text-xs font-semibold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Recompensa
          </Button>
        )}
      </div>

      {/* Selector de Pestañas Principal */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("CATALOGO")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === "CATALOGO"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Catálogo de Premios</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {list.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CANJES")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition -mb-px relative ${
            activeTab === "CANJES"
              ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Solicitudes de Canje & Entregas</span>
          {canjesPendientesCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {canjesPendientesCount} pendientes
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {canjes.length}
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB 1: CATÁLOGO ===================== */}
      {activeTab === "CATALOGO" && (
        <div className="space-y-4">
          {/* Buscador y Filtros Catálogo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                placeholder="Buscar por premio o descripción..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {["TODOS", "ACTIVA", "INACTIVA", "AGOTADA"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFiltroEstado(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                    filtroEstado === tab
                      ? "bg-[#132A38] text-teal-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab === "TODOS"
                    ? "Todas"
                    : tab === "ACTIVA"
                    ? "Activas"
                    : tab === "INACTIVA"
                    ? "Inactivas"
                    : "Agotadas"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla Catálogo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Spinner size={32} />
                <p className="text-xs text-slate-400 mt-3 font-medium">Cargando catálogo...</p>
              </div>
            ) : listFiltrado.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Gift}
                  title="No se encontraron recompensas"
                  description={
                    q || filtroEstado !== "TODOS"
                      ? "Intenta con otros filtros de búsqueda"
                      : "Crea tu primera recompensa para comenzar el catálogo"
                  }
                  actionLabel={!q && filtroEstado === "TODOS" ? "Nueva recompensa" : undefined}
                  onAction={!q && filtroEstado === "TODOS" ? openCrear : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Premio / Recompensa</th>
                      <th className="py-3.5 px-4 text-center">Costo Requerido</th>
                      <th className="py-3.5 px-4 text-center">Stock</th>
                      <th className="py-3.5 px-4">Modalidad Entrega</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {listPaginado.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {r.imagen_url ? (
                              <img
                                src={r.imagen_url}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                                <Gift className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-xs">
                                {r.nombre_recompensa}
                              </p>
                              {r.descripcion && (
                                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {r.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            {r.costo_puntos_globales} pts
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              (r.stock_disponible ?? 0) > 0
                                ? "text-slate-800 dark:text-slate-200"
                                : "text-rose-500 font-bold"
                            }`}
                          >
                            {r.stock_disponible ?? 0} unid.
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {r.tipo_entrega === "OFICINA_CENTRAL"
                              ? "Oficina Central"
                              : r.tipo_entrega === "ENVIO"
                              ? "Envío a Domicilio"
                              : "Retiro en Local"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              r.estado === "ACTIVA"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                                : r.estado === "AGOTADA"
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                r.estado === "ACTIVA"
                                  ? "bg-emerald-500"
                                  : r.estado === "AGOTADA"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {r.estado}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openVer(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditar(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition"
                              title="Editar recompensa"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEliminar(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Eliminar recompensa"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación Catálogo */}
                <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, listFiltrado.length)} -{" "}
                    {Math.min(paginaActual * ITEMS_PER_PAGE, listFiltrado.length)} de{" "}
                    <strong className="text-slate-900 dark:text-white">{listFiltrado.length}</strong> recompensas
                  </span>

                  {totalPaginas > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={paginaActual <= 1}
                        onClick={() => setPagina((p) => p - 1)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Anterior
                      </Button>
                      <span className="px-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pág. {paginaActual} / {totalPaginas}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={paginaActual >= totalPaginas}
                        onClick={() => setPagina((p) => p + 1)}
                      >
                        Siguiente
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: SOLICITUDES DE CANJE & ENTREGAS ===================== */}
      {activeTab === "CANJES" && (
        <div className="space-y-4">
          {/* Buscador y Filtros Canjes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                placeholder="Buscar por usuario, email o premio..."
                value={qCanjes}
                onChange={(e) => setQCanjes(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { key: "TODOS", label: "Todos los canjes" },
                { key: "PENDIENTE_RECOJO", label: "Pendientes de Entrega" },
                { key: "ENTREGADO", label: "Entregados" },
                { key: "CANCELADO", label: "Cancelados / Reembolsados" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFiltroCanjes(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                    filtroCanjes === tab.key
                      ? "bg-[#132A38] text-teal-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla Canjes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
            {loadingCanjes ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Spinner size={32} />
                <p className="text-xs text-slate-400 mt-3 font-medium">Cargando solicitudes de canje...</p>
              </div>
            ) : canjesFiltrados.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={ShoppingBag}
                  title="No se encontraron canjes"
                  description={
                    qCanjes || filtroCanjes !== "TODOS"
                      ? "Intenta con otros filtros de búsqueda"
                      : "Aún no se han registrado canjes de recompensas por usuarios"
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Usuario Solicitante</th>
                      <th className="py-3.5 px-4">Recompensa Solicitada</th>
                      <th className="py-3.5 px-4 text-center">Puntos Gastados</th>
                      <th className="py-3.5 px-4">Fecha de Canje</th>
                      <th className="py-3.5 px-4 text-center">Estado de Entrega</th>
                      <th className="py-3.5 px-4 text-right">Acciones de Despacho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {canjesPaginados.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* Usuario */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {c.usuario_avatar ? (
                              <img
                                src={c.usuario_avatar}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#0B1522] text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
                                {c.usuario_nombre.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[180px]">
                                {c.usuario_nombre}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {c.usuario_email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Recompensa */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {c.recompensa_imagen ? (
                              <img
                                src={c.recompensa_imagen}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                <Gift className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-xs truncate max-w-[200px]">
                                {c.nombre_recompensa}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {c.tipo_entrega?.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Puntos */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            {c.puntos_gastados} pts
                          </span>
                        </td>

                        {/* Fecha */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-xs text-slate-700 dark:text-slate-300">
                            {new Date(c.fecha_canje).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(c.fecha_canje).toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              c.estado_entrega === "PENDIENTE_RECOJO"
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20"
                                : c.estado_entrega === "ENTREGADO"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                            }`}
                          >
                            {c.estado_entrega === "PENDIENTE_RECOJO" && <Clock className="w-3 h-3 text-amber-500" />}
                            {c.estado_entrega === "ENTREGADO" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            {c.estado_entrega === "CANCELADO" && <XCircle className="w-3 h-3 text-rose-500" />}
                            {c.estado_entrega === "PENDIENTE_RECOJO"
                              ? "Pendiente Entrega"
                              : c.estado_entrega === "ENTREGADO"
                              ? "Entregado"
                              : "Cancelado / Devuelto"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Ver detalle */}
                            <button
                              type="button"
                              onClick={() => {
                                setCanjeSeleccionado(c);
                                setModalVerCanje(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Ver detalles del canje"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Acciones solo si está pendiente */}
                            {c.estado_entrega === "PENDIENTE_RECOJO" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalAccionCanje({
                                      canje: c,
                                      nuevoEstado: "ENTREGADO",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
                                  title="Marcar como entregado al usuario"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Entregar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalAccionCanje({
                                      canje: c,
                                      nuevoEstado: "CANCELADO",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                  title="Cancelar canje y devolver puntos"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Cancelar</span>
                                </button>
                              </>
                            )}

                            {c.estado_entrega === "ENTREGADO" && c.fecha_entrega && (
                              <span className="text-[10px] text-slate-400 italic pr-2">
                                Entregado el{" "}
                                {new Date(c.fecha_entrega).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación Canjes */}
                <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Mostrando {Math.min((paginaActualCanjes - 1) * ITEMS_PER_PAGE + 1, canjesFiltrados.length)} -{" "}
                    {Math.min(paginaActualCanjes * ITEMS_PER_PAGE, canjesFiltrados.length)} de{" "}
                    <strong className="text-slate-900 dark:text-white">{canjesFiltrados.length}</strong> solicitudes
                  </span>

                  {totalPaginasCanjes > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={paginaActualCanjes <= 1}
                        onClick={() => setPaginaCanjes((p) => p - 1)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Anterior
                      </Button>
                      <span className="px-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pág. {paginaActualCanjes} / {totalPaginasCanjes}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={paginaActualCanjes >= totalPaginasCanjes}
                        onClick={() => setPaginaCanjes((p) => p + 1)}
                      >
                        Siguiente
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODALES ===================== */}

      {/* Modal Crear */}
      <Modal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        title="Crear Nueva Recompensa"
        size="md"
      >
        {formRecompensa}
      </Modal>

      {/* Modal Editar */}
      <Modal
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        title="Editar Recompensa"
        size="md"
      >
        {formRecompensa}
      </Modal>

      {/* Modal Ver Recompensa */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Detalles de la Recompensa"
        size="md"
      >
        {recompensaSeleccionada && (
          <div className="space-y-4">
            {recompensaSeleccionada.imagen_url && (
              <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <img
                  src={recompensaSeleccionada.imagen_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {recompensaSeleccionada.nombre_recompensa}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Costo</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Coins className="w-3.5 h-3.5" />
                  {recompensaSeleccionada.costo_puntos_globales} puntos globales
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Stock</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {recompensaSeleccionada.stock_disponible} unidades
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Estado</p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {recompensaSeleccionada.estado}
                </span>
              </div>
              <div className="col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Modalidad y Dirección</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {recompensaSeleccionada.tipo_entrega?.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {recompensaSeleccionada.direccion_recojo || "Sin dirección específica registrada"}
                </p>
              </div>
              <div className="col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Descripción</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {recompensaSeleccionada.descripcion || "Sin descripción proporcionada."}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setModalVer(false)} variant="secondary" className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Eliminar Recompensa */}
      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar Recompensa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            ¿Estás seguro de eliminar la recompensa{" "}
            <strong className="text-slate-900 dark:text-white">
              {recompensaSeleccionada?.nombre_recompensa}
            </strong>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setModalEliminar(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={busy}
              fullWidth
              onClick={handleEliminar}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Detalle de Canje */}
      <Modal
        open={modalVerCanje}
        onClose={() => setModalVerCanje(false)}
        title="Detalles de la Solicitud de Canje"
        size="md"
      >
        {canjeSeleccionado && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              {canjeSeleccionado.usuario_avatar ? (
                <img
                  src={canjeSeleccionado.usuario_avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#0B1522] text-teal-400 font-bold text-sm flex items-center justify-center">
                  {canjeSeleccionado.usuario_nombre.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {canjeSeleccionado.usuario_nombre}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {canjeSeleccionado.usuario_email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Recompensa</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {canjeSeleccionado.nombre_recompensa}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Puntos Canjeados</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Coins className="w-3.5 h-3.5" />
                  {canjeSeleccionado.puntos_gastados} pts
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Modalidad de Entrega</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {canjeSeleccionado.tipo_entrega?.replace(/_/g, " ")}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Estado de Entrega</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                    canjeSeleccionado.estado_entrega === "PENDIENTE_RECOJO"
                      ? "text-amber-600 dark:text-amber-400"
                      : canjeSeleccionado.estado_entrega === "ENTREGADO"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {canjeSeleccionado.estado_entrega === "PENDIENTE_RECOJO"
                    ? "Pendiente de Entrega"
                    : canjeSeleccionado.estado_entrega === "ENTREGADO"
                    ? "Entregado"
                    : "Cancelado / Devuelto"}
                </span>
              </div>
              <div className="col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Punto de Entrega / Dirección</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {canjeSeleccionado.direccion_recojo || "Oficina Central de Pasaporte Virtual"}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha de Solicitud</p>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {new Date(canjeSeleccionado.fecha_canje).toLocaleString("es-PE")}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha de Entrega Final</p>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {canjeSeleccionado.fecha_entrega
                    ? new Date(canjeSeleccionado.fecha_entrega).toLocaleString("es-PE")
                    : "Pendiente de despacho"}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setModalVerCanje(false)} variant="secondary" className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmación de Despacho / Cancelación de Canje */}
      <Modal
        open={Boolean(modalAccionCanje)}
        onClose={() => setModalAccionCanje(null)}
        title={
          modalAccionCanje?.nuevoEstado === "ENTREGADO"
            ? "Confirmar Entrega de Recompensa"
            : "Cancelar Canje y Devolver Puntos"
        }
        size="sm"
      >
        {modalAccionCanje && (
          <div className="space-y-4">
            {modalAccionCanje.nuevoEstado === "ENTREGADO" ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ¿Confirmas que el premio{" "}
                <strong className="text-slate-900 dark:text-white">
                  "{modalAccionCanje.canje.nombre_recompensa}"
                </strong>{" "}
                fue entregado satisfactoriamente al usuario{" "}
                <strong className="text-slate-900 dark:text-white">
                  {modalAccionCanje.canje.usuario_nombre}
                </strong>
                ?
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ¿Estás seguro de cancelar el canje de{" "}
                <strong className="text-slate-900 dark:text-white">
                  "{modalAccionCanje.canje.nombre_recompensa}"
                </strong>
                ? Se reembolsarán automáticamente{" "}
                <strong className="text-amber-600 font-bold">
                  {modalAccionCanje.canje.puntos_gastados} puntos globales
                </strong>{" "}
                al usuario y se reintegrará 1 unidad al stock de la recompensa.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setModalAccionCanje(null)}
              >
                Volver
              </Button>
              <Button
                variant={modalAccionCanje.nuevoEstado === "ENTREGADO" ? "primary" : "danger"}
                loading={busy}
                fullWidth
                onClick={handleCambiarEstadoCanje}
              >
                {modalAccionCanje.nuevoEstado === "ENTREGADO"
                  ? "Sí, confirmar entrega"
                  : "Sí, cancelar y reembolsar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
