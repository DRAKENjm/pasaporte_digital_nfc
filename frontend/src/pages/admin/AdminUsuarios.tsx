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
  UserPlus,
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

interface AdminUsuariosProps {
  modo?: "CLIENTES" | "USUARIOS";
}

export const AdminUsuarios: React.FC<AdminUsuariosProps> = ({ modo = "USUARIOS" }) => {
  const isClientes = modo === "CLIENTES";
  const [rows, setRows] = useState<URow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroRol, setFiltroRol] = useState(isClientes ? "CLIENTE" : "TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<URow | null>(
    null,
  );
  const [form, setForm] = useState({ nombres: "", apellidos: "", email: "", rol: "", estado: "" });
  const [formCrear, setFormCrear] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    rol: isClientes ? "CLIENTE" : "COMERCIO",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorsCrear, setErrorsCrear] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { showToast } = useUI();

  // Resetear filtros si cambia el modo
  useEffect(() => {
    setFiltroRol(isClientes ? "CLIENTE" : "TODOS");
    setFiltroEstado("TODOS");
    setQ("");
    setPagina(1);
  }, [modo]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();
      const rolParam = isClientes ? "CLIENTE" : filtroRol;
      if (rolParam !== "TODOS") params.rol = rolParam;
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
  }, [modo]);

  useEffect(() => {
    setPagina(1);
  }, [q, filtroRol, filtroEstado]);

  const rowsFiltrados = useMemo(() => {
    let result = rows;
    const rolEfectivo = isClientes ? "CLIENTE" : filtroRol;
    if (rolEfectivo !== "TODOS") {
      result = result.filter((u) => u.rol_nombre === rolEfectivo);
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
  }, [rows, filtroRol, filtroEstado, q, isClientes]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(rowsFiltrados.length / ITEMS_PER_PAGE),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const rowsPaginados = rowsFiltrados.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  const openCrear = () => {
    setFormCrear({
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      password: "",
      rol: isClientes ? "CLIENTE" : "COMERCIO",
    });
    setErrorsCrear({});
    setModalCrear(true);
  };

  const validateCrear = (data: typeof formCrear): boolean => {
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
      e.email = "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      e.email = "Ingresa un correo electrónico válido";
    }

    if (data.password && data.password.trim().length < 6) {
      e.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrorsCrear(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCrear(formCrear)) return;
    setBusy(true);
    try {
      const { data } = await api.post("/admin/usuarios", {
        nombres: formCrear.nombres.trim(),
        apellidos: formCrear.apellidos.trim(),
        email: formCrear.email.trim(),
        telefono: formCrear.telefono.trim() || undefined,
        password: formCrear.password.trim() || undefined,
        rol: isClientes ? "CLIENTE" : formCrear.rol,
      });

      const tempPass = data?.data?.temporary_password;
      showToast(
        tempPass
          ? `${isClientes ? "Cliente" : "Usuario"} registrado con éxito. Clave temporal: ${tempPass}`
          : `${isClientes ? "Cliente" : "Usuario"} registrado con éxito`,
        "success",
      );
      setModalCrear(false);
      await load();
    } catch (err: any) {
      showToast(
        err.response?.data?.message || `No se pudo registrar el ${isClientes ? "cliente" : "usuario"}`,
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

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

  const formCrearModal = (
    <form onSubmit={handleCrear} className="space-y-4">
      <div className="p-3 bg-[#FAF8F5] dark:bg-slate-800/60 rounded-xl border border-[#EFE7DE] dark:border-slate-700 text-xs text-[#8E7D7D] dark:text-slate-400">
        {isClientes
          ? "Registra un nuevo cliente para la plataforma. Se le generará automáticamente su código único de pasaporte digital."
          : "Crea un nuevo usuario administrativo o comercial con credenciales de acceso seguras."}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Nombres *"
          placeholder="Ej. Carlos"
          value={formCrear.nombres}
          required
          error={errorsCrear.nombres}
          onChange={(e) => {
            setFormCrear({ ...formCrear, nombres: e.target.value });
            if (errorsCrear.nombres) setErrorsCrear({ ...errorsCrear, nombres: "" });
          }}
        />
        <Input
          label="Apellidos *"
          placeholder="Ej. Mendoza"
          value={formCrear.apellidos}
          required
          error={errorsCrear.apellidos}
          onChange={(e) => {
            setFormCrear({ ...formCrear, apellidos: e.target.value });
            if (errorsCrear.apellidos) setErrorsCrear({ ...errorsCrear, apellidos: "" });
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Correo Electrónico *"
          type="email"
          placeholder="correo@ejemplo.pe"
          value={formCrear.email}
          required
          error={errorsCrear.email}
          onChange={(e) => {
            setFormCrear({ ...formCrear, email: e.target.value });
            if (errorsCrear.email) setErrorsCrear({ ...errorsCrear, email: "" });
          }}
        />
        <Input
          label="Teléfono / Celular"
          type="tel"
          placeholder="Ej. 987654321"
          value={formCrear.telefono}
          onChange={(e) => {
            setFormCrear({ ...formCrear, telefono: e.target.value });
          }}
        />
      </div>

      {!isClientes ? (
        <label className="block space-y-1.5 w-full text-left">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
            Rol en el Sistema *
          </span>
          <select
            className="input-base"
            value={formCrear.rol}
            onChange={(e) => setFormCrear({ ...formCrear, rol: e.target.value })}
          >
            <option value="COMERCIO">Comercio (Encargado / Personal de Establecimiento)</option>
            <option value="ADMIN">Administrador General de la Plataforma</option>
            <option value="CLIENTE">Cliente / Pasaporte Digital</option>
          </select>
          <span className="text-[10px] text-muted block mt-1">
            Los usuarios COMERCIO pueden asignarse a locales para validar visitas y canjear premios NFC.
          </span>
        </label>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <span className="font-semibold">Rol Asignado:</span>
          <span className="font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px]">
            Cliente (Pasaporte Digital)
          </span>
        </div>
      )}

      <div>
        <Input
          label="Contraseña de Acceso"
          type="password"
          placeholder="Opcional (Dejar en blanco para asignar: Pass1234!)"
          value={formCrear.password}
          error={errorsCrear.password}
          onChange={(e) => {
            setFormCrear({ ...formCrear, password: e.target.value });
            if (errorsCrear.password) setErrorsCrear({ ...errorsCrear, password: "" });
          }}
        />
        <span className="text-[10px] text-[#8E7D7D] dark:text-slate-400 block mt-1">
          Si no ingresas una contraseña, se asignará la temporal <strong>Pass1234!</strong> que el usuario podrá cambiar al iniciar sesión.
        </span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={busy} fullWidth>
          {isClientes ? "Registrar Cliente" : "Crear Usuario"}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setModalCrear(false)}
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
        <div>
          <h1 className="text-xl font-black text-[#2D1A1E]">
            {isClientes ? "Gestión de Clientes" : "Gestión de Usuarios"}
          </h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            {isClientes
              ? "Clientes registrados con pasaporte digital y sellos acumulados"
              : "Administración general de accesos y roles del sistema"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-[#8E7D7D] bg-white border border-[#E8DFD5] px-3 py-1.5 rounded-xl shadow-2xs">
            {rowsFiltrados.length} {isClientes ? (rowsFiltrados.length !== 1 ? "clientes" : "cliente") : (rowsFiltrados.length !== 1 ? "usuarios" : "usuario")}
          </span>
          <button
            type="button"
            onClick={openCrear}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#7C0A1E] hover:bg-[#600616] text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isClientes ? "Nuevo Cliente" : "Nuevo Usuario"}</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Buscador a la izquierda + Filtros a la derecha en la misma fila */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E7D7D] pointer-events-none z-10" />
          <input
            className="input-base input-with-search"
            placeholder={isClientes ? "Buscar cliente por nombre o email..." : "Buscar usuario por nombre o email..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {!isClientes && (
            <select
              className="input-base w-full sm:w-44 text-xs font-semibold"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="TODOS">Todos los roles</option>
              <option value="CLIENTE">Cliente</option>
              <option value="COMERCIO">Comercio</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}

          <select
            className="input-base w-full sm:w-44 text-xs font-semibold"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>
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
          <div className="table-card-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EFE7DE]/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 text-muted font-bold uppercase">
                    <th className="p-3.5">Usuario / Nombre</th>
                    <th className="p-3.5">Correo Electrónico</th>
                    <th className="p-3.5">Rol de Sistema</th>
                    <th className="p-3.5">Nivel / Sellos</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DE]/60 dark:divide-slate-800/60">
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
                          {u.rol_nombre !== "ADMIN" && u.rol_nombre !== "ADMIN_GENERAL" && (
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
            <div className="p-3.5 border-t border-[#EFE7DE]/70 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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

      <Modal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        title={isClientes ? "Registrar Nuevo Cliente" : "Registrar Nuevo Usuario"}
        size="md"
      >
        {formCrearModal}
      </Modal>
    </div>
  );
};
