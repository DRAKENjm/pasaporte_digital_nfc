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
  SquarePen,
  Trash,
  UserX,
  UserCheck,
  Eye,
  Mail,
  Shield,
  Award,
  Coins,
  Calendar,
} from "lucide-react";
import { initials } from "../../utils/levels";

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
  avatar_url?: string;
}

export const AdminUsuarios: React.FC = () => {
  const [rows, setRows] = useState<URow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<URow | null>(
    null,
  );
  const [form, setForm] = useState({ nombres: "", apellidos: "", email: "", rol: "", estado: "" });
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
      rol: u.rol_nombre ?? "CLIENTE",
      estado: u.estado ?? "ACTIVO",
    });
    setErrors({});
    setModalEditar(true);
  };

  const openVer = (u: URow) => {
    setUsuarioSeleccionado(u);
    setModalVer(true);
  };

  const openEliminar = (u: URow) => {
    if (u.rol_nombre === "ADMIN") return;
    setUsuarioSeleccionado(u);
    setModalEliminar(true);
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
        rol: form.rol,
        estado: form.estado,
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

  const handleEliminar = async () => {
    if (!usuarioSeleccionado) return;
    setBusy(true);
    try {
      await api.delete(`/admin/usuarios/${usuarioSeleccionado.id}`);
      showToast("Usuario eliminado", "success");
      setModalEliminar(false);
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al eliminar", "error");
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Rol
          </label>
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="CLIENTE">Cliente</option>
            <option value="COMERCIO">Comercio</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Estado
          </label>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>
      </div>
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

  const modalEliminarContent = (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        ¿Estás seguro de que deseas eliminar permanentemente a{" "}
        <strong className="text-slate-900 dark:text-white">
          {usuarioSeleccionado?.nombres} {usuarioSeleccionado?.apellidos}
        </strong>
        ?
      </p>
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium border border-amber-200 dark:border-amber-900/50">
        Esta acción no se puede deshacer. El usuario desaparecerá completamente del sistema.
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="danger" fullWidth onClick={handleEliminar} loading={busy}>
          Sí, eliminar
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
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-200/60 dark:border-teal-500/20 shrink-0">
                              {initials(u)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <strong className="text-slate-900 dark:text-white font-semibold block text-xs truncate">
                              {u.nombres} {u.apellidos}
                            </strong>
                          </div>
                        </div>
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
                            onClick={() => openVer(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditar(u)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition"
                            title="Editar datos"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          {u.rol_nombre !== "ADMIN" && (
                            <button
                              type="button"
                              onClick={() => openEliminar(u)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                              title="Eliminar usuario"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
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
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Ficha del Usuario"
        size="lg"
      >
        {usuarioSeleccionado && (
          <div className="space-y-5">
            {/* Header del Usuario */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              {usuarioSeleccionado.avatar_url ? (
                <img
                  src={usuarioSeleccionado.avatar_url}
                  alt={`${usuarioSeleccionado.nombres} ${usuarioSeleccionado.apellidos}`}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-xl flex items-center justify-center border border-teal-200/60 dark:border-teal-500/20 shadow-2xs shrink-0">
                  {initials(usuarioSeleccionado)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {usuarioSeleccionado.nombres} {usuarioSeleccionado.apellidos}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      usuarioSeleccionado.estado === "ACTIVO"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        usuarioSeleccionado.estado === "ACTIVO"
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />
                    {usuarioSeleccionado.estado}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {usuarioSeleccionado.email}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      usuarioSeleccionado.rol_nombre === "ADMIN"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : usuarioSeleccionado.rol_nombre === "COMERCIO"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                    }`}
                  >
                    {usuarioSeleccionado.rol_nombre}
                  </span>
                </div>
              </div>
            </div>

            {/* Ficha de Detalles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Rango / Nivel de Pasaporte
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {usuarioSeleccionado.nivel_nombre || "Bronce"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Puntos Globales Acumulados
                  </p>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {usuarioSeleccionado.puntos_globales || 0} pts
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total de Sellos Obtenidos
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {usuarioSeleccionado.total_sellos || 0} sellos
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Fecha de Registro
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {usuarioSeleccionado.created_at
                      ? new Date(usuarioSeleccionado.created_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
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

      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar usuario"
        size="sm"
      >
        {modalEliminarContent}
      </Modal>
    </div>
  );
};
