import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { CategoriaEstablecimiento } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  Tag,
  Plus,
  Search,
  SquarePen,
  Trash,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

const EMOJI_PRESETS = [
  "☕", "🍔", "🍕", "🍰", "🍷", "🍹", "🍣", "🌮", "🍦", "🥗",
  "🛍️", "👗", "👟", "💈", "💅", "🏋️", "📚", "🎮", "🏨", "✈️"
];

export const AdminCategorias: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaEstablecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVO" | "INACTIVO">("TODOS");

  // Modales
  const [modalForm, setModalForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoriaEstablecimiento | null>(null);

  // Form State
  const [nombre, setNombre] = useState("");
  const [iconoUrl, setIconoUrl] = useState("☕");
  const [estado, setEstado] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useUI();

  const loadCategorias = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/categorias");
      const list = data?.data ?? data ?? [];
      setCategorias(Array.isArray(list) ? list : []);
    } catch {
      showToast("Error al cargar las categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  const openCrear = () => {
    setIsEditing(false);
    setSelectedCat(null);
    setNombre("");
    setIconoUrl("☕");
    setEstado(true);
    setErrors({});
    setModalForm(true);
  };

  const openEditar = (cat: CategoriaEstablecimiento) => {
    setIsEditing(true);
    setSelectedCat(cat);
    setNombre(cat.nombre);
    setIconoUrl(cat.icono_url || "☕");
    setEstado(Boolean(cat.estado));
    setErrors({});
    setModalForm(true);
  };

  const openEliminar = (cat: CategoriaEstablecimiento) => {
    setSelectedCat(cat);
    setModalEliminar(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrors({ nombre: "El nombre es obligatorio" });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      if (isEditing && selectedCat) {
        await api.patch(`/admin/categorias/${selectedCat.id}`, {
          nombre: nombre.trim(),
          icono_url: iconoUrl.trim(),
          estado,
        });
        showToast("Categoría actualizada correctamente", "success");
      } else {
        await api.post("/admin/categorias", {
          nombre: nombre.trim(),
          icono_url: iconoUrl.trim(),
          estado,
        });
        showToast("Categoría creada con éxito", "success");
      }
      setModalForm(false);
      await loadCategorias();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo guardar la categoría";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!selectedCat) return;
    setSaving(true);
    try {
      await api.delete(`/admin/categorias/${selectedCat.id}`);
      showToast("Categoría eliminada", "success");
      setModalEliminar(false);
      setSelectedCat(null);
      await loadCategorias();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar categoría";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (cat: CategoriaEstablecimiento) => {
    try {
      await api.patch(`/admin/categorias/${cat.id}`, {
        estado: !cat.estado,
      });
      showToast(
        !cat.estado ? "Categoría activada" : "Categoría desactivada",
        "success",
      );
      setCategorias((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, estado: !c.estado } : c)),
      );
    } catch (err: any) {
      showToast("Error al cambiar estado", "error");
    }
  };

  const filteredCategorias = useMemo(() => {
    return categorias.filter((c) => {
      const matchText = c.nombre.toLowerCase().includes(search.toLowerCase());
      if (filtroEstado === "ACTIVO") return matchText && c.estado;
      if (filtroEstado === "INACTIVO") return matchText && !c.estado;
      return matchText;
    });
  }, [categorias, search, filtroEstado]);

  const stats = useMemo(() => {
    const total = categorias.length;
    const activas = categorias.filter((c) => c.estado).length;
    const conLocales = categorias.reduce((acc, curr) => acc + (Number(curr.total_locales) || 0), 0);
    return { total, activas, conLocales };
  }, [categorias]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <Tag className="w-4 h-4" />
            <span>Gestión de Locales</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Categorías de Establecimientos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clasifica y organiza los tipos de comercios aliados (Cafeterías, Restaurantes, Bares, etc.)
          </p>
        </div>

        <Button
          onClick={openCrear}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs text-xs font-semibold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Categorías
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Categorías Activas
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.activas}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Locales Vinculados
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.conLocales}
            </p>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["TODOS", "ACTIVO", "INACTIVO"] as const).map((tab) => (
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
              {tab === "TODOS" ? "Todas" : tab === "ACTIVO" ? "Activas" : "Inactivas"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Categorías */}
      <div className="table-card-container">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="text-xs text-slate-400 mt-3 font-medium">Cargando categorías...</p>
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Tag}
              title="No se encontraron categorías"
              description={search ? "Prueba con otro término de búsqueda" : "Crea tu primera categoría para organizar los comercios"}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ícono / Emoji</th>
                  <th className="py-3.5 px-4">Nombre de Categoría</th>
                  <th className="py-3.5 px-4 text-center">Locales Asignados</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategorias.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Ícono / Emoji */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                        {cat.icono_url || "🏷️"}
                      </div>
                    </td>

                    {/* Nombre */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {cat.nombre}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ID: #{cat.id}
                      </p>
                    </td>

                    {/* Locales Asignados */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-500/20">
                        <Building2 className="w-3.5 h-3.5" />
                        {cat.total_locales ?? 0} {Number(cat.total_locales) === 1 ? "local" : "locales"}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          cat.estado
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                        }`}
                        title="Clic para cambiar estado"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cat.estado ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {cat.estado ? "Activo" : "Inactivo"}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditar(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition"
                          title="Editar categoría"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEliminar(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                          title="Eliminar categoría"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      <Modal
        open={modalForm}
        onClose={() => setModalForm(false)}
        title={isEditing ? "Editar Categoría" : "Nueva Categoría de Locales"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre de la Categoría"
            placeholder="Ej: Cafetería, Bar & Cocktails, Barbería..."
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errors.nombre) setErrors({});
            }}
            error={errors.nombre}
            autoFocus
          />

          {/* Selector de Emoji o Ícono */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ícono o Emoji Representativo
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={iconoUrl}
                onChange={(e) => setIconoUrl(e.target.value)}
                maxLength={4}
                placeholder="☕"
                className="w-16 h-12 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
              <div className="flex-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selecciona uno de los sugeridos o escribe tu propio emoji:
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIconoUrl(emoji)}
                      className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition ${
                        iconoUrl === emoji
                          ? "bg-teal-500 text-white shadow-xs scale-110"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Toggle de Estado */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Estado Activo
              </p>
              <p className="text-[11px] text-slate-400">
                Las categorías activas están visibles al crear o filtrar locales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEstado(!estado)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                estado ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  estado ? "right-1" : "left-1"
                }`}
              />
            </button>
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
              {saving ? <Spinner size={16} /> : isEditing ? "Actualizar Categoría" : "Guardar Categoría"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar Categoría"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            ¿Estás seguro de que deseas eliminar la categoría{" "}
            <strong className="text-slate-900 dark:text-white">
              {selectedCat?.nombre}
            </strong>
            ?
          </p>

          {Number(selectedCat?.total_locales) > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              ⚠️ Esta categoría tiene{" "}
              <strong>{selectedCat?.total_locales} local(es)</strong> asignado(s).
              No se puede eliminar de la base de datos hasta reasignar los locales a otra categoría, pero puedes desactivarla.
            </div>
          )}

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
