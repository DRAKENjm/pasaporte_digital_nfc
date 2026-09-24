import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { Recompensa } from "../../types";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  Plus,
  Pencil,
  Trash2,
  Gift,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  nombre_recompensa: "",
  descripcion: "",
  costo_puntos_globales: 100,
  stock_disponible: 10,
  tipo_entrega: "OFICINA_CENTRAL",
  direccion_recojo: "",
  imagen_url: "",
};

export const AdminRecompensas: React.FC = () => {
  const [list, setList] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [recompensaSeleccionada, setRecompensaSeleccionada] =
    useState<Recompensa | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { showToast } = useUI();

  const load = async () => {
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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [q, filtroEstado]);

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

  const totalPaginas = Math.max(
    1,
    Math.ceil(listFiltrado.length / ITEMS_PER_PAGE),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const listPaginado = listFiltrado.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  const openCrear = () => {
    setForm(emptyForm);
    setErrors({});
    setModalCrear(true);
  };

  const openEditar = (r: Recompensa) => {
    setRecompensaSeleccionada(r);
    setForm({
      nombre_recompensa: r.nombre_recompensa ?? "",
      descripcion: r.descripcion ?? "",
      costo_puntos_globales: r.costo_puntos_globales ?? 0,
      stock_disponible: r.stock_disponible ?? 0,
      tipo_entrega: r.tipo_entrega ?? "OFICINA_CENTRAL",
      direccion_recojo: r.direccion_recojo ?? "",
      imagen_url: r.imagen_url ?? "",
    });
    setErrors({});
    setModalEditar(true);
  };

  const openEliminar = (r: Recompensa) => {
    setRecompensaSeleccionada(r);
    setModalEliminar(true);
  };

  const validate = (data: typeof emptyForm): boolean => {
    const e: Record<string, string> = {};

    if (!data.nombre_recompensa.trim()) {
      e.nombre_recompensa = "El nombre es obligatorio";
    } else if (data.nombre_recompensa.trim().length < 3) {
      e.nombre_recompensa = "Debe tener al menos 3 caracteres";
    }

    if (data.costo_puntos_globales < 0) {
      e.costo_puntos_globales = "Los puntos no pueden ser negativos";
    } else if (!Number.isInteger(data.costo_puntos_globales)) {
      e.costo_puntos_globales = "Debe ser un número entero";
    }

    if (data.stock_disponible != null && data.stock_disponible < 0) {
      e.stock_disponible = "El stock no puede ser negativo";
    } else if (
      data.stock_disponible != null &&
      !Number.isInteger(data.stock_disponible)
    ) {
      e.stock_disponible = "Debe ser un número entero";
    }

    if (data.imagen_url && !/^https?:\/\/.+/i.test(data.imagen_url)) {
      e.imagen_url = "Ingresa una URL válida (https://...)";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;
    setBusy(true);
    try {
      await api.post("/admin/recompensas", {
        nombre_recompensa: form.nombre_recompensa.trim(),
        descripcion: form.descripcion.trim() || null,
        costo_puntos_globales: form.costo_puntos_globales,
        stock_disponible: form.stock_disponible,
        tipo_entrega: form.tipo_entrega,
        direccion_recojo: form.direccion_recojo.trim() || null,
        imagen_url: form.imagen_url.trim() || null,
      });
      showToast("Recompensa creada", "success");
      setModalCrear(false);
      await load();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo crear",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form) || !recompensaSeleccionada) return;
    setBusy(true);
    try {
      await api.patch(`/admin/recompensas/${recompensaSeleccionada.id}`, {
        nombre_recompensa: form.nombre_recompensa.trim(),
        descripcion: form.descripcion.trim() || null,
        costo_puntos_globales: form.costo_puntos_globales,
        stock_disponible: form.stock_disponible,
        tipo_entrega: form.tipo_entrega,
        direccion_recojo: form.direccion_recojo.trim() || null,
        imagen_url: form.imagen_url.trim() || null,
      });
      showToast("Recompensa actualizada", "success");
      setModalEditar(false);
      await load();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo actualizar",
        "error",
      );
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
      await load();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo eliminar",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const formRecompensa = (
    <form
      onSubmit={(e) =>
        modalCrear ? handleCrear(e) : handleEditar(e)
      }
      className="space-y-3"
    >
      <Input
        label="Nombre *"
        value={form.nombre_recompensa}
        required
        error={errors.nombre_recompensa}
        onChange={(e) => {
          setForm({ ...form, nombre_recompensa: e.target.value });
          if (errors.nombre_recompensa)
            setErrors({ ...errors, nombre_recompensa: "" });
        }}
      />
      <div className="space-y-1.5 w-full text-left">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Descripción
        </span>
        <textarea
          className="input-base min-h-[70px] resize-y"
          rows={2}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Costo (pts) *"
          type="number"
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
          label="Stock"
          type="number"
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
      <label className="block space-y-1.5 w-full text-left">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tipo de entrega
        </span>
        <select
          className="input-base"
          value={form.tipo_entrega}
          onChange={(e) =>
            setForm({ ...form, tipo_entrega: e.target.value })
          }
        >
          <option value="OFICINA_CENTRAL">Oficina central</option>
          <option value="ENVIO">Envío a domicilio</option>
          <option value="RETIERO_EN_TIENDA">Retiro en tienda</option>
        </select>
      </label>
      <Input
        label="Dirección de recojo"
        value={form.direccion_recojo}
        onChange={(e) =>
          setForm({ ...form, direccion_recojo: e.target.value })
        }
      />
      <Input
        label="URL de imagen"
        placeholder="https://..."
        value={form.imagen_url}
        error={errors.imagen_url}
        onChange={(e) => {
          setForm({ ...form, imagen_url: e.target.value });
          if (errors.imagen_url) setErrors({ ...errors, imagen_url: "" });
        }}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={busy} fullWidth>
          {modalCrear ? "Crear recompensa" : "Guardar cambios"}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setModalCrear(false);
            setModalEditar(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  const confirmarEliminar = (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        ¿Estás seguro de eliminar{" "}
        <strong className="text-slate-800">
          {recompensaSeleccionada?.nombre_recompensa}
        </strong>
        ? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-2 pt-1">
        <Button
          variant="danger"
          loading={busy}
          fullWidth
          onClick={handleEliminar}
        >
          Eliminar
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
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Recompensas</h1>
        <Button onClick={openCrear}>
          <Plus className="w-4 h-4" />
          Nueva recompensa
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input-base pl-10"
            placeholder="Buscar por nombre o descripción..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input-base w-auto min-w-[130px]"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="ACTIVA">Activa</option>
          <option value="INACTIVA">Inactiva</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : listFiltrado.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No se encontraron recompensas"
          description={
            q || filtroEstado !== "TODOS"
              ? "Intenta con otros filtros"
              : "Crea tu primera recompensa para comenzar"
          }
          actionLabel={
            !q && filtroEstado === "TODOS" ? "Nueva recompensa" : undefined
          }
          onAction={
            !q && filtroEstado === "TODOS" ? openCrear : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-2">
            {listPaginado.map((r) => (
              <li key={r.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm">
                        {r.nombre_recompensa}
                      </strong>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.estado === "ACTIVA"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {r.estado}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {r.costo_puntos_globales} pts · Stock{" "}
                      {r.stock_disponible ?? "—"}
                      {r.tipo_entrega &&
                        ` · ${r.tipo_entrega.replace(/_/g, " ")}`}
                    </p>
                    {r.descripcion && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {r.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditar(r)}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEliminar(r)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={paginaActual <= 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-xs text-muted">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        title="Nueva recompensa"
        size="md"
      >
        {formRecompensa}
      </Modal>

      <Modal
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        title="Editar recompensa"
        size="md"
      >
        {formRecompensa}
      </Modal>

      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar recompensa"
        size="sm"
      >
        {confirmarEliminar}
      </Modal>
    </div>
  );
};
