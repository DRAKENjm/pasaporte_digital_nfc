import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { ReglaSello, Establecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  Award,
  Plus,
  Search,
  Building2,
  Calendar,
  Zap,
  Sliders,
  SquarePen,
  Trash,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export const AdminReglas: React.FC = () => {
  const [reglas, setReglas] = useState<ReglaSello[]>([]);
  const [locales, setLocales] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVA" | "INACTIVA">("TODOS");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [modalForm, setModalForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [selectedRegla, setSelectedRegla] = useState<ReglaSello | null>(null);

  const [saving, setSaving] = useState(false);
  const { showToast } = useUI();

  // Form State
  const [form, setForm] = useState({
    establecimiento_id: "",
    nombre_accion: "Visita estándar",
    valor_puntos_por_sello: 10,
    limite_diario_por_usuario: 1,
    estado: "ACTIVA",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [reg, est] = await Promise.all([
        api.get("/admin/reglas-sellos").catch(() => ({ data: { data: [] } })),
        api.get("/establishments").catch(() => ({ data: { data: [] } })),
      ]);
      const r = reg.data?.data ?? reg.data ?? [];
      setReglas(Array.isArray(r) ? r : []);
      const e = est.data?.data ?? est.data ?? [];
      setLocales(Array.isArray(e) ? e : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCrear = () => {
    setIsEditing(false);
    setSelectedRegla(null);
    setForm({
      establecimiento_id: locales[0]?.id || "",
      nombre_accion: "Visita estándar",
      valor_puntos_por_sello: 10,
      limite_diario_por_usuario: 1,
      estado: "ACTIVA",
      fecha_inicio: "",
      fecha_fin: "",
    });
    setErrors({});
    setModalForm(true);
  };

  const openEditar = (r: ReglaSello) => {
    setIsEditing(true);
    setSelectedRegla(r);
    setForm({
      establecimiento_id: r.establecimiento_id,
      nombre_accion: r.nombre_accion,
      valor_puntos_por_sello: r.valor_puntos_por_sello,
      limite_diario_por_usuario: r.limite_diario_por_usuario,
      estado: r.estado,
      fecha_inicio: r.fecha_inicio ? r.fecha_inicio.slice(0, 10) : "",
      fecha_fin: r.fecha_fin ? r.fecha_fin.slice(0, 10) : "",
    });
    setErrors({});
    setModalForm(true);
  };

  const openVer = (r: ReglaSello) => {
    setSelectedRegla(r);
    setModalVer(true);
  };

  const openEliminar = (r: ReglaSello) => {
    setSelectedRegla(r);
    setModalEliminar(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.establecimiento_id) {
      setErrors({ establecimiento_id: "Selecciona un local" });
      return;
    }
    if (!form.nombre_accion.trim()) {
      setErrors({ nombre_accion: "El nombre de la acción es obligatorio" });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      if (isEditing && selectedRegla) {
        await api.patch(`/admin/reglas-sellos/${selectedRegla.id}`, {
          ...form,
          valor_puntos_por_sello: Number(form.valor_puntos_por_sello),
          limite_diario_por_usuario: Number(form.limite_diario_por_usuario),
          fecha_inicio: form.fecha_inicio || null,
          fecha_fin: form.fecha_fin || null,
        });
        showToast("Regla actualizada con éxito", "success");
      } else {
        await api.post("/admin/reglas-sellos", {
          ...form,
          valor_puntos_por_sello: Number(form.valor_puntos_por_sello),
          limite_diario_por_usuario: Number(form.limite_diario_por_usuario),
          fecha_inicio: form.fecha_inicio || null,
          fecha_fin: form.fecha_fin || null,
        });
        showToast("Regla creada con éxito", "success");
      }
      setModalForm(false);
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo guardar la regla", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedRegla) return;
    setSaving(true);
    try {
      await api.delete(`/admin/reglas-sellos/${selectedRegla.id}`);
      showToast("Regla eliminada", "success");
      setModalEliminar(false);
      setSelectedRegla(null);
      await load();
    } catch {
      showToast("Error al eliminar la regla", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (r: ReglaSello) => {
    const nuevo = r.estado === "ACTIVA" ? "INACTIVA" : "ACTIVA";
    try {
      await api.patch(`/admin/reglas-sellos/${r.id}`, { estado: nuevo });
      showToast(nuevo === "ACTIVA" ? "Regla activada" : "Regla desactivada", "success");
      setReglas((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, estado: nuevo } : item)),
      );
    } catch {
      showToast("Error al cambiar estado", "error");
    }
  };

  const filteredReglas = useMemo(() => {
    let result = reglas;
    if (filtroEstado === "ACTIVA") {
      result = result.filter((r) => r.estado === "ACTIVA");
    } else if (filtroEstado === "INACTIVA") {
      result = result.filter((r) => r.estado !== "ACTIVA");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.nombre_accion.toLowerCase().includes(q) ||
          (r.establecimiento_nombre || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [reglas, search, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filteredReglas.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const reglasPaginadas = filteredReglas.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setPagina(1);
  }, [search, filtroEstado]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <Award className="w-4 h-4" />
            <span>Fidelización & Gamificación</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Gestión de sellos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configura los puntos otorgados por cada sello validado, límites diarios y temporadas por local
          </p>
        </div>

        <Button
          onClick={openCrear}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs text-xs font-semibold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla
        </Button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por local o acción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["TODOS", "ACTIVA", "INACTIVA"] as const).map((tab) => (
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
              {tab === "TODOS" ? "Todas" : tab === "ACTIVA" ? "Activas" : "Inactivas"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Reglas de Sellos */}
      <div className="table-card-container">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="text-xs text-slate-400 mt-3 font-medium">Cargando reglas de sellos...</p>
          </div>
        ) : filteredReglas.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Award}
              title="No se encontraron reglas de sellos"
              description={
                search || filtroEstado !== "TODOS"
                  ? "Prueba ajustando los filtros de búsqueda"
                  : "Crea tu primera regla para definir cuántos puntos gana el cliente por sello"
              }
              actionLabel={!search && filtroEstado === "TODOS" ? "Nueva Regla" : undefined}
              onAction={!search && filtroEstado === "TODOS" ? openCrear : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Acción / Beneficio</th>
                  <th className="py-3.5 px-4">Local Afiliado</th>
                  <th className="py-3.5 px-4 text-center">Puntos / Sello</th>
                  <th className="py-3.5 px-4 text-center">Límite Diario</th>
                  <th className="py-3.5 px-4 text-center">Temporada</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reglasPaginadas.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Acción */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">
                            {r.nombre_accion}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: #{r.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Local */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {r.establecimiento_nombre || "Todos los locales"}
                      </span>
                    </td>

                    {/* Puntos por sello */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-500/20">
                        <Zap className="w-3.5 h-3.5 fill-teal-500/30" />
                        {r.valor_puntos_por_sello} pts
                      </span>
                    </td>

                    {/* Límite diario */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {r.limite_diario_por_usuario} {r.limite_diario_por_usuario === 1 ? "sello/día" : "sellos/día"}
                      </span>
                    </td>

                    {/* Temporada */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {r.fecha_inicio || r.fecha_fin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString() : "Inicio"} -{" "}
                          {r.fecha_fin ? new Date(r.fecha_fin).toLocaleDateString() : "Fin"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">— Permanente —</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(r)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          r.estado === "ACTIVA"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                        }`}
                        title="Clic para cambiar estado"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.estado === "ACTIVA" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {r.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                      </button>
                    </td>

                    {/* Acciones */}
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
                          title="Editar regla"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEliminar(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                          title="Eliminar regla"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, filteredReglas.length)} -{" "}
                {Math.min(paginaActual * ITEMS_PER_PAGE, filteredReglas.length)} de{" "}
                <strong className="text-slate-900 dark:text-white">{filteredReglas.length}</strong> reglas
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

      {/* Modal Crear / Editar */}
      <Modal
        open={modalForm}
        onClose={() => setModalForm(false)}
        title={isEditing ? "Editar Regla de Sellos" : "Nueva Regla de Sellos"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block space-y-1.5 w-full text-left">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Establecimiento *
            </span>
            <select
              className="input-base"
              required
              value={form.establecimiento_id}
              onChange={(e) =>
                setForm({ ...form, establecimiento_id: e.target.value })
              }
            >
              <option value="">Selecciona un local...</option>
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.razon_social || l.nombre}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Nombre de la acción o beneficio *"
            placeholder="Ej: Visita estándar, Consumo > S/. 50, Promo Feriado"
            value={form.nombre_accion}
            required
            error={errors.nombre_accion}
            onChange={(e) =>
              setForm({ ...form, nombre_accion: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Puntos por sello *"
              type="number"
              min={1}
              value={form.valor_puntos_por_sello}
              onChange={(e) =>
                setForm({
                  ...form,
                  valor_puntos_por_sello: Math.max(1, Number(e.target.value)),
                })
              }
            />
            <Input
              label="Límite diario por cliente *"
              type="number"
              min={1}
              value={form.limite_diario_por_usuario}
              onChange={(e) =>
                setForm({
                  ...form,
                  limite_diario_por_usuario: Math.max(1, Number(e.target.value)),
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Inicio de temporada (Opcional)"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) =>
                setForm({ ...form, fecha_inicio: e.target.value })
              }
            />
            <Input
              label="Fin de temporada (Opcional)"
              type="date"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalForm(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
            >
              {saving ? <Spinner size={16} /> : isEditing ? "Actualizar Regla" : "Crear Regla"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Detalles de la Regla"
        size="md"
      >
        {selectedRegla && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRegla.nombre_accion}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {selectedRegla.establecimiento_nombre || "Todos los locales"}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  selectedRegla.estado === "ACTIVA"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {selectedRegla.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Puntos Otorgados</p>
                <p className="text-base font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                  {selectedRegla.valor_puntos_por_sello} pts / sello
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Límite Diario</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedRegla.limite_diario_por_usuario} por cliente
                </p>
              </div>
              <div className="col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vigencia / Temporada</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {selectedRegla.fecha_inicio || selectedRegla.fecha_fin ? (
                    <span>
                      Desde {selectedRegla.fecha_inicio ? new Date(selectedRegla.fecha_inicio).toLocaleDateString() : "el inicio"} hasta{" "}
                      {selectedRegla.fecha_fin ? new Date(selectedRegla.fecha_fin).toLocaleDateString() : "fin indeterminado"}
                    </span>
                  ) : (
                    <span>Regla permanente activa</span>
                  )}
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

      {/* Modal Confirmar Eliminar */}
      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar Regla de Sellos"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            ¿Estás seguro de que deseas eliminar la regla{" "}
            <strong className="text-slate-900 dark:text-white">
              {selectedRegla?.nombre_accion}
            </strong>
            ? Esta acción es irreversible.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setModalEliminar(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {saving ? <Spinner size={16} /> : "Eliminar Definitivamente"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
