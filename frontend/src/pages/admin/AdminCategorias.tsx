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
  CategoryIcon,
  MODERN_CATEGORY_PRESETS,
} from "../../components/common/CategoryIcon";
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
  Layers,
  ChevronRight,
} from "lucide-react";

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
  const [iconoUrl, setIconoUrl] = useState("coffee");
  const [estado, setEstado] = useState(true);
  const [customIconMode, setCustomIconMode] = useState(false);
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
    setIconoUrl("coffee");
    setEstado(true);
    setCustomIconMode(false);
    setErrors({});
    setModalForm(true);
  };

  const openEditar = (cat: CategoriaEstablecimiento) => {
    setIsEditing(true);
    setSelectedCat(cat);
    setNombre(cat.nombre);
    setIconoUrl(cat.icono_url || "coffee");
    setEstado(Boolean(cat.estado));
    setCustomIconMode(
      !MODERN_CATEGORY_PRESETS.some((p) => p.id === cat.icono_url) &&
        !MODERN_CATEGORY_PRESETS.some((p) => p.emoji === cat.icono_url),
    );
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
    } catch {
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
    const conLocales = categorias.reduce(
      (acc, c) => acc + (Number(c.total_locales) || 0),
      0,
    );
    return { total, activas, conLocales };
  }, [categorias]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7C0A1E] font-bold text-xs tracking-wider uppercase">
            <Tag className="w-4 h-4" />
            <span>Gestión y Clasificación</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#2D1A1E] mt-1">
            Categorías de Establecimientos
          </h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Clasifica y organiza los tipos de comercios aliados con iconografía moderna y descriptiva
          </p>
        </div>

        <Button
          onClick={openCrear}
          className="bg-[#7C0A1E] hover:bg-[#680718] text-white rounded-2xl shadow-xs text-xs font-bold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#7C0A1E]/10 flex items-center justify-center text-[#7C0A1E] shrink-0 border border-[#7C0A1E]/15">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
              Total Categorías
            </p>
            <p className="text-xl font-black text-[#2D1A1E] mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
              Categorías Activas
            </p>
            <p className="text-xl font-black text-[#2D1A1E] mt-0.5">
              {stats.activas}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#EFE7DE] p-4 rounded-2xl shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#7C0A1E] shrink-0 border border-[#E8DFD5]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
              Locales Vinculados
            </p>
            <p className="text-xl font-black text-[#7C0A1E] mt-0.5">
              {stats.conLocales}
            </p>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-white border border-[#EFE7DE] rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E7D7D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre de categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base input-with-search"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["TODOS", "ACTIVO", "INACTIVO"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFiltroEstado(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                filtroEstado === tab
                  ? "bg-[#7C0A1E] text-white shadow-2xs"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E] hover:bg-[#FAF8F5]"
              }`}
            >
              {tab === "TODOS" ? "Todas" : tab === "ACTIVO" ? "Activas" : "Inactivas"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Categorías */}
      <div className="bg-white border border-[#EFE7DE] rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="text-xs text-[#8E7D7D] mt-3 font-medium">Cargando categorías...</p>
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Tag}
              title="No se encontraron categorías"
              description={search ? "Prueba con otro término de búsqueda" : "Crea tu primera categoría para clasificar los locales"}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EFE7DE] text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ícono Moderno</th>
                  <th className="py-3.5 px-4">Nombre de Categoría</th>
                  <th className="py-3.5 px-4 text-center">Locales Vinculados</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]">
                {filteredCategorias.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#FAF8F5]/80 transition group"
                  >
                    {/* Ícono Moderno */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="w-11 h-11 rounded-2xl bg-[#7C0A1E]/10 border border-[#7C0A1E]/15 text-[#7C0A1E] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <CategoryIcon icon={cat.icono_url} className="w-5 h-5 text-[#7C0A1E]" />
                      </div>
                    </td>

                    {/* Nombre */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-[#2D1A1E] text-sm">
                        {cat.nombre}
                      </p>
                      <p className="text-[10px] text-[#8E7D7D] font-mono mt-0.5">
                        Identificador: #{cat.id} • Clave de Ícono: <span className="font-bold text-[#7C0A1E]">{cat.icono_url || "coffee"}</span>
                      </p>
                    </td>

                    {/* Locales Asignados */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#2D1A1E] border border-[#E8DFD5]">
                        <Building2 className="w-3.5 h-3.5 text-[#7C0A1E]" />
                        {cat.total_locales ?? 0} {Number(cat.total_locales) === 1 ? "local" : "locales"}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(cat)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                          cat.estado
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
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
                          className="p-2 rounded-xl text-[#8E7D7D] hover:text-[#7C0A1E] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8DFD5] transition"
                          title="Editar categoría"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEliminar(cat)}
                          className="p-2 rounded-xl text-[#8E7D7D] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
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
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre de la Categoría *"
            placeholder="Ej: Cafeterías de Especialidad, Turismo y Monumentos..."
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errors.nombre) setErrors({});
            }}
            error={errors.nombre}
            autoFocus
          />

          {/* Vista previa del Ícono */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EFE7DE] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#7C0A1E] text-white flex items-center justify-center shadow-sm">
                <CategoryIcon icon={iconoUrl} className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2D1A1E]">
                  Ícono Seleccionado: <span className="font-mono text-[#7C0A1E]">{iconoUrl}</span>
                </p>
                <p className="text-[11px] text-[#8E7D7D] mt-0.5">
                  Este ícono vectorial se usará en los sellos y en la identificación de los locales.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCustomIconMode(!customIconMode)}
              className="text-[11px] font-bold text-[#7C0A1E] hover:underline shrink-0"
            >
              {customIconMode ? "Ver catálogo moderno" : "Ingresar personalizado"}
            </button>
          </div>

          {/* Selector de Íconos Modernos Vectoriales */}
          {!customIconMode ? (
            <div>
              <label className="block text-xs font-bold text-[#2D1A1E] mb-2 uppercase tracking-wider">
                Catálogo de Íconos Vectoriales Modernos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                {MODERN_CATEGORY_PRESETS.map((preset) => {
                  const IconComp = preset.icon;
                  const isSelected = iconoUrl === preset.id || iconoUrl === preset.emoji;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setIconoUrl(preset.id)}
                      className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-[#7C0A1E]/10 border-[#7C0A1E] text-[#7C0A1E] shadow-2xs scale-[1.02]"
                          : "bg-white hover:bg-[#FAF8F5] border-[#EFE7DE] text-[#2D1A1E]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? "bg-[#7C0A1E] text-white"
                              : "bg-[#FAF8F5] text-[#7C0A1E]"
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#7C0A1E]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold truncate leading-tight">
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-[#8E7D7D] truncate mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#2D1A1E] mb-1.5 uppercase tracking-wider">
                Clave, Emoji o URL Personalizada
              </label>
              <input
                type="text"
                value={iconoUrl}
                onChange={(e) => setIconoUrl(e.target.value)}
                placeholder="Ej: coffee, landmark, 🏛️ o https://ejemplo.com/icono.svg"
                className="input-base"
              />
              <p className="text-[11px] text-[#8E7D7D] mt-1">
                Puedes escribir un slug como <code>landmark</code>, <code>coffee</code>, <code>utensils</code>, <code>wine</code> o una URL de icono.
              </p>
            </div>
          )}

          {/* Toggle de Estado */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE]">
            <div>
              <p className="text-xs font-bold text-[#2D1A1E]">
                Estado Activo
              </p>
              <p className="text-[11px] text-[#8E7D7D]">
                Las categorías activas están visibles al crear o filtrar locales en el pasaporte digital
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEstado(!estado)}
              className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none ${
                estado ? "bg-[#7C0A1E]" : "bg-slate-300"
              }`}
            >
              <span
                className={`w-4.5 h-4.5 bg-white rounded-full absolute top-1 transition-transform ${
                  estado ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE7DE]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalForm(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              className="bg-[#7C0A1E] hover:bg-[#680718] text-white font-bold"
            >
              {isEditing ? "Actualizar Categoría" : "Guardar Categoría"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar Categoría"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#2D1A1E]">
            ¿Estás seguro de que deseas eliminar la categoría{" "}
            <strong>
              {selectedCat?.nombre}
            </strong>
            ?
          </p>

          {Number(selectedCat?.total_locales) > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
              ⚠️ Esta categoría tiene{" "}
              <strong>{selectedCat?.total_locales} local(es)</strong> asignado(s).
              Reasigna los locales a otra categoría antes de eliminarla definitivamente, o simplemente desactívala.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE7DE]">
            <Button
              variant="secondary"
              onClick={() => setModalEliminar(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={saving}
              loading={saving}
              variant="danger"
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
