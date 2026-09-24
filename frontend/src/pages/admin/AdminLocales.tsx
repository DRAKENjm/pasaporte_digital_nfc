import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import { Establecimiento, User } from "../../types";
import {
  Plus,
  Pencil,
  UserPlus,
  Trash2,
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  razon_social: "",
  ruc: "",
  direccion: "",
  google_maps_url: "",
  descripcion: "",
  telefono: "",
  horario: "",
  categoria_id: "",
  estado: "ACTIVO",
};

const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  if (!url.trim()) return null;
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /maps\?.*ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /(-?\d+\.?\d+),\s*(-?\d+\.?\d+)/,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
};

export const AdminLocales = () => {
  const [locales, setLocales] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalPersonal, setModalPersonal] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [localSeleccionado, setLocalSeleccionado] =
    useState<Establecimiento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useState("");

  const [categorias, setCategorias] = useState<
    { id: string; nombre: string }[]
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useUI();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/establishments");
      setLocales(data?.data ?? []);
    } catch {
      showToast("No se pudieron cargar los locales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api
      .get("/admin/usuarios", { params: { rol: "COMERCIO" } })
      .then((r) => setUsers(r.data?.data ?? []))
      .catch(() => {});
    api
      .get("/establishments/categorias")
      .then((r) => setCategorias(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const localesFiltrados = useMemo(() => {
    let result = locales;
    if (filtroEstado !== "TODOS") {
      result = result.filter((l) => l.estado === filtroEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.razon_social?.toLowerCase().includes(q) ||
          l.ruc?.toLowerCase().includes(q) ||
          l.direccion?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [locales, filtroEstado, search]);

  const totalPaginas = Math.max(1, Math.ceil(localesFiltrados.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const localesPaginados = localesFiltrados.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setPagina(1);
  }, [search, filtroEstado]);

  const openCrear = () => {
    setForm(emptyForm);
    setLocalSeleccionado(null);
    setModalCrear(true);
  };

  const openEditar = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    const mapsUrl =
      local.lat != null && local.lng != null
        ? `https://www.google.com/maps?q=${local.lat},${local.lng}`
        : "";
    setForm({
      razon_social: local.razon_social ?? "",
      ruc: local.ruc ?? "",
      direccion: local.direccion ?? "",
      google_maps_url: mapsUrl,
      descripcion: local.descripcion ?? "",
      telefono: local.telefono ?? "",
      horario: local.horario ?? "",
      categoria_id: local.categoria_id ?? "",
      estado: local.estado ?? "ACTIVO",
    });
    setModalEditar(true);
  };

  const openPersonal = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    setStaff("");
    setModalPersonal(true);
  };

  const openEliminar = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    setModalEliminar(true);
  };

  const validate = (data: typeof emptyForm): boolean => {
    const e: Record<string, string> = {};

    if (!data.razon_social.trim()) {
      e.razon_social = "El nombre del local es obligatorio";
    } else if (data.razon_social.trim().length < 3) {
      e.razon_social = "El nombre debe tener al menos 3 caracteres";
    } else if (/^([a-zA-Z])\1+$/.test(data.razon_social.trim())) {
      e.razon_social = "El nombre no puede ser solo caracteres repetidos";
    }

    if (!data.ruc.trim()) {
      e.ruc = "El RUC es obligatorio";
    } else if (!/^\d{11}$/.test(data.ruc.trim())) {
      e.ruc = "El RUC debe tener exactamente 11 dígitos";
    }

    if (!data.direccion.trim()) {
      e.direccion = "La dirección es obligatoria";
    } else if (data.direccion.trim().length < 5) {
      e.direccion = "La dirección debe tener al menos 5 caracteres";
    }

    if (data.telefono && !/^\d{0,15}$/.test(data.telefono.replace(/[\s\-\(\)]/g, ""))) {
      e.telefono = "El teléfono solo puede contener números (máx. 15)";
    }

    if (data.google_maps_url && !parseGoogleMapsUrl(data.google_maps_url)) {
      e.google_maps_url =
        "No se pudieron extraer coordenadas. Pega un enlace válido de Google Maps";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;
    setBusy(true);
    try {
      const coords = parseGoogleMapsUrl(form.google_maps_url);
      await api.post("/establishments", {
        razon_social: form.razon_social,
        ruc: form.ruc,
        direccion: form.direccion,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        categoria_id: form.categoria_id || null,
        telefono: form.telefono || null,
        descripcion: form.descripcion || null,
      });
      showToast("Local creado", "success");
      setModalCrear(false);
      await load();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo crear el local",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;
    if (!localSeleccionado) return;
    setBusy(true);
    try {
      const coords = parseGoogleMapsUrl(form.google_maps_url);
      await api.patch(`/establishments/${localSeleccionado.id}`, {
        razon_social: form.razon_social,
        direccion: form.direccion,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        descripcion: form.descripcion || null,
        telefono: form.telefono || null,
        horario: form.horario || null,
        categoria_id: form.categoria_id || null,
        estado: form.estado,
      });
      showToast("Local actualizado", "success");
      setModalEditar(false);
      await load();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo guardar",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAsignarPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSeleccionado) return;
    setBusy(true);
    try {
      await api.post(`/establishments/${localSeleccionado.id}/personal`, {
        usuario_id: staff,
      });
      showToast("Personal asignado", "success");
      setModalPersonal(false);
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo asignar",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleEliminar = async () => {
    if (!localSeleccionado) return;
    setBusy(true);
    try {
      await api.delete(`/establishments/${localSeleccionado.id}`);
      showToast("Local eliminado", "success");
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

  const formCrear = (
    <form onSubmit={handleCrear} className="space-y-3">
      <Input
        label="Razón social *"
        value={form.razon_social}
        required
        error={errors.razon_social}
        onChange={(e) => {
          setForm({ ...form, razon_social: e.target.value });
          if (errors.razon_social) setErrors({ ...errors, razon_social: "" });
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="RUC *"
          value={form.ruc}
          required
          maxLength={11}
          error={errors.ruc}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 11);
            setForm({ ...form, ruc: val });
            if (errors.ruc) setErrors({ ...errors, ruc: "" });
          }}
        />
        <label className="block space-y-1.5 w-full text-left">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Categoría
          </span>
          <select
            className="input-base"
            value={form.categoria_id}
            onChange={(e) =>
              setForm({ ...form, categoria_id: e.target.value })
            }
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Input
        label="Dirección *"
        value={form.direccion}
        required
        error={errors.direccion}
        onChange={(e) => {
          setForm({ ...form, direccion: e.target.value });
          if (errors.direccion) setErrors({ ...errors, direccion: "" });
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Teléfono"
          value={form.telefono}
          error={errors.telefono}
          onChange={(e) => {
            setForm({ ...form, telefono: e.target.value });
            if (errors.telefono) setErrors({ ...errors, telefono: "" });
          }}
        />
        <Input
          label="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>
      <Input
        label="URL de Google Maps"
        placeholder="https://www.google.com/maps?q=..."
        value={form.google_maps_url}
        error={errors.google_maps_url}
        onChange={(e) => {
          setForm({ ...form, google_maps_url: e.target.value });
          if (errors.google_maps_url)
            setErrors({ ...errors, google_maps_url: "" });
        }}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={busy} fullWidth>
          Crear local
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setErrors({});
            setModalCrear(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  const formEditar = (
    <form onSubmit={handleEditar} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Razón social *"
          value={form.razon_social}
          required
          error={errors.razon_social}
          onChange={(e) => {
            setForm({ ...form, razon_social: e.target.value });
            if (errors.razon_social)
              setErrors({ ...errors, razon_social: "" });
          }}
        />
        <Input label="RUC" value={form.ruc} disabled />
      </div>
      <Input
        label="Dirección *"
        value={form.direccion}
        required
        error={errors.direccion}
        onChange={(e) => {
          setForm({ ...form, direccion: e.target.value });
          if (errors.direccion) setErrors({ ...errors, direccion: "" });
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="URL de Google Maps"
          placeholder="https://www.google.com/maps?q=..."
          value={form.google_maps_url}
          error={errors.google_maps_url}
          onChange={(e) => {
            setForm({ ...form, google_maps_url: e.target.value });
            if (errors.google_maps_url)
              setErrors({ ...errors, google_maps_url: "" });
          }}
        />
        <label className="block space-y-1.5 w-full text-left">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estado
          </span>
          <select
            className="input-base"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="SUSPENDIDO">Suspendido</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Teléfono"
          value={form.telefono}
          error={errors.telefono}
          onChange={(e) => {
            setForm({ ...form, telefono: e.target.value });
            if (errors.telefono) setErrors({ ...errors, telefono: "" });
          }}
        />
        <Input
          label="Horario"
          value={form.horario}
          onChange={(e) => setForm({ ...form, horario: e.target.value })}
        />
        <label className="block space-y-1.5 w-full text-left">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Categoría
          </span>
          <select
            className="input-base"
            value={form.categoria_id}
            onChange={(e) =>
              setForm({ ...form, categoria_id: e.target.value })
            }
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-1.5 w-full text-left">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Descripción
        </span>
        <textarea
          className="input-base min-h-[80px] resize-y"
          rows={3}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={busy} fullWidth>
          Guardar cambios
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setErrors({});
            setModalEditar(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  const formPersonal = (
    <form onSubmit={handleAsignarPersonal} className="space-y-3">
      <p className="text-sm text-slate-600">
        Asigna un usuario COMERCIO al local{" "}
        <strong className="text-slate-800">
          {localSeleccionado?.razon_social}
        </strong>
      </p>
      <label className="block space-y-1.5 w-full text-left">
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Selecciona un usuario
        </span>
        <select
          className="input-base"
          required
          value={staff}
          onChange={(e) => setStaff(e.target.value)}
        >
          <option value="">Selecciona un usuario COMERCIO</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombres} {u.apellidos} · {u.email}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={busy} fullWidth disabled={!staff}>
          Asignar al local
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setModalPersonal(false)}
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
          {localSeleccionado?.razon_social}
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
        <h1 className="text-xl font-bold">Locales y ubicaciones</h1>
        <Button onClick={openCrear}>
          <Plus className="w-4 h-4" />
          Nuevo local
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input-base pl-10"
            placeholder="Buscar por nombre, RUC o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-base w-auto min-w-[140px]"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : localesFiltrados.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No se encontraron locales"
          description={
            search || filtroEstado !== "TODOS"
              ? "Intenta con otros filtros de búsqueda"
              : "Crea tu primer local para comenzar"
          }
          actionLabel={!search && filtroEstado === "TODOS" ? "Nuevo local" : undefined}
          onAction={!search && filtroEstado === "TODOS" ? openCrear : undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900/50 text-muted font-bold uppercase">
                    <th className="p-3.5">Establecimiento / Razón Social</th>
                    <th className="p-3.5">RUC / Categoría</th>
                    <th className="p-3.5">Dirección & Contacto</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--app-border))]">
                  {localesPaginados.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-500/5 transition">
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white font-semibold block">
                          {l.razon_social}
                        </strong>
                        {l.nombre && l.nombre !== l.razon_social && (
                          <span className="text-[11px] text-muted">{l.nombre}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-semibold block">{l.ruc}</span>
                        {l.categoria_nombre && (
                          <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {l.categoria_nombre}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-700 dark:text-slate-300">{l.direccion || "Sin dirección registrada"}</p>
                        {l.telefono && (
                          <p className="text-[10px] text-muted mt-0.5">{l.telefono}</p>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            l.estado === "ACTIVO"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : l.estado === "INACTIVO"
                              ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {l.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditar(l)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Editar local"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPersonal(l)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Asignar personal COMERCIO"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEliminar(l)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar local"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación y Resumen */}
            <div className="p-3.5 border-t border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-muted">
                Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, localesFiltrados.length)} -{" "}
                {Math.min(paginaActual * ITEMS_PER_PAGE, localesFiltrados.length)} de{" "}
                <strong className="text-slate-900 dark:text-white">{localesFiltrados.length}</strong> locales
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
        </div>
      )}

      <Modal
        open={modalCrear}
        onClose={() => {
          setErrors({});
          setModalCrear(false);
        }}
        title="Nuevo local"
        size="sm"
      >
        {formCrear}
      </Modal>

      <Modal
        open={modalEditar}
        onClose={() => {
          setErrors({});
          setModalEditar(false);
        }}
        title="Editar local"
        size="xl"
      >
        {formEditar}
      </Modal>

      <Modal
        open={modalPersonal}
        onClose={() => setModalPersonal(false)}
        title="Asignar personal"
        size="sm"
      >
        {formPersonal}
      </Modal>

      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar local"
        size="sm"
      >
        {confirmarEliminar}
      </Modal>
    </div>
  );
};
