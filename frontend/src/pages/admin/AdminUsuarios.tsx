import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Shield,
  Ban,
  CheckCircle,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface URow {
  id: string;
  nombres?: string;
  apellidos?: string;
  email: string;
  rol_nombre?: string;
  nivel_nombre?: string;
  total_sellos?: number;
  puntos_globales?: number;
  estado?: string;
  created_at?: string;
}

export const AdminUsuarios: React.FC = () => {
  const [rows, setRows] = useState<URow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalRol, setModalRol] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<URow | null>(
    null,
  );
  const [form, setForm] = useState({ nombres: "", apellidos: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { showToast } = useUI();

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();
      if (filtroRol !== "TODOS") params.rol = filtroRol;
      if (filtroEstado !== "TODOS") params.estado = filtroEstado;
      const { data } = await api.get("/admin/usuarios", { params });
      const list = data?.data ?? data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch {
      showToast("No se pudieron cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [q, filtroRol, filtroEstado]);

  const rowsFiltrados = useMemo(() => {
    let result = rows;
    if (filtroRol !== "TODOS") {
      result = result.filter((u) => u.rol_nombre === filtroRol);
    }
    if (filtroEstado !== "TODOS") {
      result = result.filter((u) => u.estado === filtroEstado);
    }
    if (q.trim()) {
      const ql = q.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(ql) ||
          u.nombres?.toLowerCase().includes(ql) ||
          u.apellidos?.toLowerCase().includes(ql),
      );
    }
    return result;
  }, [rows, filtroRol, filtroEstado, q]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(rowsFiltrados.length / ITEMS_PER_PAGE),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const rowsPaginados = rowsFiltrados.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  const openEditar = (u: URow) => {
    setUsuarioSeleccionado(u);
    setForm({
      nombres: u.nombres ?? "",
      apellidos: u.apellidos ?? "",
      email: u.email ?? "",
    });
    setErrors({});
    setModalEditar(true);
  };

  const openRol = (u: URow) => {
    setUsuarioSeleccionado(u);
    setModalRol(true);
  };

  const openEstado = (u: URow) => {
    setUsuarioSeleccionado(u);
    setModalEstado(true);
  };

  const validate = (data: typeof form): boolean => {
    const e: Record<string, string> = {};

    if (!data.nombres.trim()) {
      e.nombres = "Los nombres son obligatorios";
    } else if (data.nombres.trim().length < 2) {
      e.nombres = "Debe tener al menos 2 caracteres";
    }

    if (!data.apellidos.trim()) {
      e.apellidos = "Los apellidos son obligatorios";
    } else if (data.apellidos.trim().length < 2) {
      e.apellidos = "Debe tener al menos 2 caracteres";
    }

    if (!data.email.trim()) {
      e.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      e.email = "Ingresa un email válido";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form) || !usuarioSeleccionado) return;
    setBusy(true);
    try {
      await api.patch(`/admin/usuarios/${usuarioSeleccionado.id}`, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
      });
      showToast("Usuario actualizado", "success");
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

  const handleRol = async (rol: string) => {
    if (!usuarioSeleccionado) return;
    setBusy(true);
    try {
      await api.patch(`/admin/usuarios/${usuarioSeleccionado.id}/rol`, {
        rol,
      });
      showToast("Rol actualizado", "success");
      setModalRol(false);
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleEstado = async (estado: string) => {
    if (!usuarioSeleccionado) return;
    setBusy(true);
    try {
      await api.patch(`/admin/usuarios/${usuarioSeleccionado.id}/estado`, {
        estado,
      });
      showToast("Estado actualizado", "success");
      setModalEstado(false);
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error", "error");
    } finally {
      setBusy(false);
    }
  };

  const formEditar = (
    <form onSubmit={handleEditar} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nombres *"
          value={form.nombres}
          required
          error={errors.nombres}
          onChange={(e) => {
            setForm({ ...form, nombres: e.target.value });
            if (errors.nombres) setErrors({ ...errors, nombres: "" });
          }}
        />
        <Input
          label="Apellidos *"
          value={form.apellidos}
          required
          error={errors.apellidos}
          onChange={(e) => {
            setForm({ ...form, apellidos: e.target.value });
            if (errors.apellidos) setErrors({ ...errors, apellidos: "" });
          }}
        />
      </div>
      <Input
        label="Email *"
        type="email"
        value={form.email}
        required
        error={errors.email}
        onChange={(e) => {
          setForm({ ...form, email: e.target.value });
          if (errors.email) setErrors({ ...errors, email: "" });
        }}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={busy} fullWidth>
          Guardar cambios
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setModalEditar(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );

  const modalRolContent = (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Cambiar rol de{" "}
        <strong className="text-slate-800">
          {usuarioSeleccionado?.nombres} {usuarioSeleccionado?.apellidos}
        </strong>
      </p>
      <div className="space-y-2">
        {["CLIENTE", "COMERCIO", "ADMIN"].map((rol) => (
          <button
            key={rol}
            type="button"
            onClick={() => handleRol(rol)}
            disabled={busy || usuarioSeleccionado?.rol_nombre === rol}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${
              usuarioSeleccionado?.rol_nombre === rol
                ? "bg-sky-50 border-sky-300 text-sky-700"
                : "border-slate-200 hover:bg-slate-50 text-slate-700"
            } disabled:opacity-50`}
          >
            {rol}
            {usuarioSeleccionado?.rol_nombre === rol && (
              <span className="ml-2 text-xs">(actual)</span>
            )}
          </button>
        ))}
      </div>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setModalRol(false)}
      >
        Cancelar
      </Button>
    </div>
  );

  const modalEstadoContent = (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Cambiar estado de{" "}
        <strong className="text-slate-800">
          {usuarioSeleccionado?.nombres} {usuarioSeleccionado?.apellidos}
        </strong>
      </p>
      <div className="space-y-2">
        {[
          { value: "ACTIVO", label: "Activo", icon: CheckCircle, color: "emerald" },
          { value: "INACTIVO", label: "Inactivo", icon: Ban, color: "slate" },
          { value: "BLOQUEADO", label: "Bloqueado", icon: Ban, color: "red" },
        ].map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleEstado(value)}
            disabled={busy || usuarioSeleccionado?.estado === value}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition ${
              usuarioSeleccionado?.estado === value
                ? `bg-${color}-50 border-${color}-300 text-${color}-700`
                : "border-slate-200 hover:bg-slate-50 text-slate-700"
            } disabled:opacity-50`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {usuarioSeleccionado?.estado === value && (
              <span className="ml-auto text-xs">(actual)</span>
            )}
          </button>
        ))}
      </div>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setModalEstado(false)}
      >
        Cancelar
      </Button>
    </div>
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Usuarios</h1>
        <span className="text-sm text-slate-500">
          {rowsFiltrados.length} usuario{rowsFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input-base pl-10"
            placeholder="Buscar por nombre o email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select
          className="input-base w-auto min-w-[130px]"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="TODOS">Todos los roles</option>
          <option value="CLIENTE">Cliente</option>
          <option value="COMERCIO">Comercio</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          className="input-base w-auto min-w-[130px]"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="BLOQUEADO">Bloqueado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : rowsFiltrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron usuarios"
          description={
            q || filtroRol !== "TODOS" || filtroEstado !== "TODOS"
              ? "Intenta con otros filtros de búsqueda"
              : "Aún no hay usuarios registrados"
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900/50 text-muted font-bold uppercase">
                    <th className="p-3.5">Usuario / Nombre</th>
                    <th className="p-3.5">Correo Electrónico</th>
                    <th className="p-3.5">Rol de Sistema</th>
                    <th className="p-3.5">Nivel / Sellos</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--app-border))]">
                  {rowsPaginados.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-500/5 transition">
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white font-semibold block">
                          {u.nombres} {u.apellidos}
                        </strong>
                      </td>
                      <td className="p-3.5 text-muted font-mono">
                        {u.email}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.rol_nombre === "ADMIN"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : u.rol_nombre === "COMERCIO"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                          }`}
                        >
                          {u.rol_nombre}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {u.rol_nombre === "CLIENTE" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{u.nivel_nombre || "Bronce"}</span>
                            <span className="text-[10px] text-muted font-mono">
                              ({u.total_sellos ?? 0} sellos · {u.puntos_globales ?? 0} pts)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted italic">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.estado === "ACTIVO"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : u.estado === "BLOQUEADO"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditar(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Editar datos"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openRol(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Cambiar rol"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEstado(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Cambiar estado"
                          >
                            {u.estado === "ACTIVO" ? (
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            )}
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
                Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, rowsFiltrados.length)} -{" "}
                {Math.min(paginaActual * ITEMS_PER_PAGE, rowsFiltrados.length)} de{" "}
                <strong className="text-slate-900 dark:text-white">{rowsFiltrados.length}</strong> usuarios
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
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        title="Editar usuario"
        size="sm"
      >
        {formEditar}
      </Modal>

      <Modal
        open={modalRol}
        onClose={() => setModalRol(false)}
        title="Cambiar rol"
        size="sm"
      >
        {modalRolContent}
      </Modal>

      <Modal
        open={modalEstado}
        onClose={() => setModalEstado(false)}
        title="Cambiar estado"
        size="sm"
      >
        {modalEstadoContent}
      </Modal>
    </div>
  );
};
