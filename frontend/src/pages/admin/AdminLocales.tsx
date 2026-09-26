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
  SquarePen,
  UserPlus,
  Trash,
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Tag,
  Image,
  Upload,
  X,
  Loader2,
  ShieldCheck,
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
  imagen_url: "",
  puntos_por_visita: 20,
  estado: "ACTIVO",
};

const isValidGoogleMapsUrl = (url: string): boolean => {
  if (!url.trim()) return false;
  return /^(https?:\/\/)?([a-zA-Z0-9.-]+\.)?(google\.com(\.[a-z]+)?|goo\.gl)\/(maps|maps\/place|maps\/search|search\/|\?|app)?/i.test(
    url.trim(),
  ) || url.includes("maps.app.goo.gl") || url.includes("google.com/maps");
};

const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  if (!url.trim()) return null;
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /maps\?.*ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
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
  const [modalVer, setModalVer] = useState(false);
  const [modalPersonal, setModalPersonal] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [localSeleccionado, setLocalSeleccionado] =
    useState<Establecimiento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useState("");

  const [categorias, setCategorias] = useState<
    { id: string | number; nombre: string; icono_url?: string }[]
  >([]);

  // Modal para creación rápida de usuario COMERCIO
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [nuevoUsuarioNombres, setNuevoUsuarioNombres] = useState("");
  const [nuevoUsuarioApellidos, setNuevoUsuarioApellidos] = useState("");
  const [nuevoUsuarioEmail, setNuevoUsuarioEmail] = useState("");
  const [nuevoUsuarioTelefono, setNuevoUsuarioTelefono] = useState("");
  const [nuevoUsuarioPassword, setNuevoUsuarioPassword] = useState("Local2026!");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useUI();

  const handleCrearUsuarioRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoUsuarioNombres.trim() || !nuevoUsuarioApellidos.trim() || !nuevoUsuarioEmail.trim()) {
      showToast("Completa nombres, apellidos y correo electrónico", "error");
      return;
    }
    setCreandoUsuario(true);
    try {
      const res = await api.post("/admin/usuarios", {
        nombres: nuevoUsuarioNombres.trim(),
        apellidos: nuevoUsuarioApellidos.trim(),
        email: nuevoUsuarioEmail.trim().toLowerCase(),
        telefono: nuevoUsuarioTelefono.trim() || null,
        password: nuevoUsuarioPassword.trim() || "Local2026!",
        rol: "COMERCIO",
      });
      const nuevo = res.data?.data || res.data;
      if (nuevo) {
        setUsers((prev) => [nuevo, ...prev]);
        setStaff(String(nuevo.id));
        showToast(`Usuario ${nuevo.nombres} registrado y seleccionado como encargado`, "success");
        setModalNuevoUsuario(false);
        setNuevoUsuarioNombres("");
        setNuevoUsuarioApellidos("");
        setNuevoUsuarioEmail("");
        setNuevoUsuarioTelefono("");
        setNuevoUsuarioPassword("Local2026!");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo registrar el usuario", "error");
    } finally {
      setCreandoUsuario(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("La imagen no puede superar los 10 MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const { data } = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.url || data?.url;
      if (url) {
        setForm((prev) => ({ ...prev, imagen_url: url }));
        showToast("Imagen subida con éxito", "success");
      }
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "No se pudo subir la imagen",
        "error",
      );
    } finally {
      setUploading(false);
      // Limpiar input file para permitir seleccionar la misma imagen si se desea
      e.target.value = "";
    }
  };

  const [modoEliminar, setModoEliminar] = useState<"SOFT" | "FORCE">("SOFT");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/locales");
      setLocales(data?.data ?? []);
    } catch {
      showToast("No se pudieron cargar los locales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Cargar usuarios de rol COMERCIO para asignación
    api
      .get("/admin/usuarios", { params: { rol: "COMERCIO" } })
      .then((r) => setUsers(r.data?.data ?? []))
      .catch(() => {});
    api
      .get("/admin/categorias")
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
          l.nombre?.toLowerCase().includes(q) ||
          l.ruc?.toLowerCase().includes(q) ||
          l.direccion?.toLowerCase().includes(q) ||
          l.usuario_encargado_email?.toLowerCase().includes(q) ||
          l.usuario_encargado_nombre?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [locales, filtroEstado, search]);

  // Filtrar usuarios comercio: excluir los que ya están asignados a otro local
  const usuariosDisponibles = useMemo(() => {
    const asignadosEnOtros = new Set(
      locales
        .filter((l) => {
          if (!localSeleccionado) return true;
          const idSel = String((localSeleccionado as any).id_establecimiento || localSeleccionado.id);
          const lId = String((l as any).id_establecimiento || l.id);
          return lId !== idSel;
        })
        .map((l) => String(l.usuario_encargado_id || ""))
        .filter(Boolean),
    );

    return users.filter((u) => !asignadosEnOtros.has(String(u.id)));
  }, [users, locales, localSeleccionado]);

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
    setStaff("");
    setLocalSeleccionado(null);
    setModalCrear(true);
  };

  const openVer = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    setModalVer(true);
  };

  const openEditar = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    const mapsUrl =
      local.lat != null && local.lng != null
        ? `https://www.google.com/maps?q=${local.lat},${local.lng}`
        : "";
    setStaff(local.usuario_encargado_id ? String(local.usuario_encargado_id) : "");
    setForm({
      razon_social: local.razon_social ?? local.nombre ?? "",
      ruc: local.ruc ?? "",
      direccion: local.direccion ?? "",
      google_maps_url: mapsUrl,
      descripcion: local.descripcion ?? "",
      telefono: local.telefono ?? "",
      horario: local.horario ?? "",
      categoria_id: local.categoria_id ? String(local.categoria_id) : "",
      imagen_url: local.imagen_url ?? "",
      puntos_por_visita: (local as any).puntos_por_visita ?? 20,
      estado: local.estado ?? "ACTIVO",
    });
    setModalEditar(true);
  };

  const openPersonal = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    setStaff(local.usuario_encargado_id ? String(local.usuario_encargado_id) : "");
    api
      .get("/admin/usuarios", { params: { rol: "COMERCIO" } })
      .then((r) => setUsers(r.data?.data ?? []))
      .catch(() => {});
    setModalPersonal(true);
  };

  const openEliminar = (local: Establecimiento) => {
    setLocalSeleccionado(local);
    setModoEliminar("SOFT");
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

    if (data.google_maps_url) {
      const trimmed = data.google_maps_url.trim();
      if (!isValidGoogleMapsUrl(trimmed) && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        e.google_maps_url = "Ingresa un enlace válido de Google Maps (ej. https://maps.app.goo.gl/...)";
      }
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
      await api.post("/admin/locales", {
        razon_social: form.razon_social,
        ruc: form.ruc,
        direccion: form.direccion,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        categoria_id: form.categoria_id || null,
        telefono: form.telefono || null,
        descripcion: form.descripcion || null,
        horario: form.horario || null,
        imagen_url: form.imagen_url.trim() || null,
        puntos_por_visita: Number(form.puntos_por_visita) || 20,
        usuario_id: staff || null,
      });
      showToast("Local creado con éxito", "success");
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
      await api.patch(`/admin/locales/${localSeleccionado.id}`, {
        razon_social: form.razon_social,
        direccion: form.direccion,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        descripcion: form.descripcion || null,
        telefono: form.telefono || null,
        horario: form.horario || null,
        categoria_id: form.categoria_id || null,
        imagen_url: form.imagen_url.trim() || null,
        puntos_por_visita: Number(form.puntos_por_visita) || 20,
        estado: form.estado,
        usuario_id: staff || null,
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
      await api.patch(`/admin/locales/${localSeleccionado.id}`, {
        usuario_id: staff || null,
      });
      showToast("Personal asignado correctamente", "success");
      setModalPersonal(false);
      await load();
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
      await api.delete(`/admin/locales/${localSeleccionado.id}`, {
        data: { modo: modoEliminar },
      });
      showToast(
        modoEliminar === "SOFT"
          ? "Local desactivado (Historial preservado)"
          : "Local eliminado permanentemente",
        "success",
      );
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
    <form onSubmit={handleCrear} className="space-y-6">
      {/* 1. Datos Principales del Local */}
      <div className="bg-[#FAF8F5]/80 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-[#EFE7DE] dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EFE7DE] dark:border-slate-800">
          <Store className="w-4 h-4 text-[#7C0A1E] dark:text-[#C5A059]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] dark:text-white">
            Identificación del Lugar / Local
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Razón Social o Nombre del Lugar / Local *"
            placeholder="Ej: Cafetería Central S.A.C."
            value={form.razon_social}
            required
            error={errors.razon_social}
            onChange={(e) => {
              setForm({ ...form, razon_social: e.target.value });
              if (errors.razon_social) setErrors({ ...errors, razon_social: "" });
            }}
          />
          <Input
            label="RUC *"
            hint="11 dígitos numéricos"
            placeholder="Ej: 20123456789"
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 w-full text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Categoría del Lugar / Local *
            </label>
            <select
              className="input-base"
              value={form.categoria_id}
              onChange={(e) =>
                setForm({ ...form, categoria_id: e.target.value })
              }
            >
              <option value="">Selecciona una categoría comercial...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icono_url ? `${c.icono_url} ` : "☕ "}{c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 w-full text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Puntos por Visita / Sello NFC *
            </label>
            <input
              type="number"
              min="1"
              max="500"
              className="input-base font-black text-[#7C0A1E] dark:text-[#C5A059]"
              value={form.puntos_por_visita || 20}
              onChange={(e) =>
                setForm({ ...form, puntos_por_visita: Math.max(1, Number(e.target.value)) })
              }
              required
            />
            <span className="text-[10px] text-muted block">
              Puntos acreditados al validar con NFC (por defecto 20 pts).
            </span>
          </div>
        </div>

        <div className="space-y-1.5 w-full text-left pt-1">
          <div className="flex items-center justify-between gap-2 pb-0.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Usuario Encargado (Cuenta COMERCIO)
            </label>
            <button
              type="button"
              onClick={() => setModalNuevoUsuario(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C0A1E] dark:text-[#E8D3A2] hover:underline cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Registrar nuevo usuario</span>
            </button>
          </div>

          {usuariosDisponibles.length === 0 ? (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                  Sin usuarios COMERCIO disponibles
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 truncate">
                  Todos los usuarios existentes ya están asignados a otros locales.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoUsuario(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear cuenta ahora</span>
              </button>
            </div>
          ) : (
            <select
              className="input-base"
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
            >
              <option value="">Sin asignar por ahora (puedes asignarlo después)</option>
              {usuariosDisponibles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombres} {u.apellidos} · {u.email}
                </option>
              ))}
            </select>
          )}

          <span className="text-[10px] text-muted block">
            Este usuario podrá iniciar sesión en el portal Comercio para validar visitas y canjear premios. (Los usuarios ya asignados a otro local quedan excluidos automáticamente).
          </span>
        </div>
      </div>

      {/* 2. Ubicación y Horarios */}
      <div className="bg-[#FAF8F5]/80 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-[#EFE7DE] dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EFE7DE] dark:border-slate-800">
          <MapPin className="w-4 h-4 text-[#7C0A1E] dark:text-[#C5A059]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] dark:text-white">
            Ubicación & Horarios de Atención
          </h4>
        </div>

        <Input
          label="Dirección Principal *"
          placeholder="Ej: Av. Larco 1234, Miraflores, Lima"
          value={form.direccion}
          required
          error={errors.direccion}
          onChange={(e) => {
            setForm({ ...form, direccion: e.target.value });
            if (errors.direccion) setErrors({ ...errors, direccion: "" });
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Horario de Atención"
            placeholder="Ej: Lun a Sáb: 8:00 AM - 10:00 PM"
            value={form.horario}
            onChange={(e) => setForm({ ...form, horario: e.target.value })}
          />
          <Input
            label="Enlace Google Maps (Opcional)"
            placeholder="https://maps.app.goo.gl/... o https://maps.google.com/..."
            value={form.google_maps_url}
            error={errors.google_maps_url}
            onChange={(e) => {
              setForm({ ...form, google_maps_url: e.target.value });
              if (errors.google_maps_url)
                setErrors({ ...errors, google_maps_url: "" });
            }}
          />
        </div>
      </div>

      {/* 3. Foto / Portada del Local */}
      <div className="bg-[#FAF8F5]/80 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-[#EFE7DE] dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DE] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#7C0A1E] dark:text-[#C5A059]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] dark:text-white">
              Fotografía o Fachada del Local
            </h4>
          </div>
          <span className="text-[10px] text-[#8E7D7D]">JPG, PNG, WEBP (máx. 10 MB)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5">
            <label
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-xs font-bold cursor-pointer transition ${
                uploading
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-400 cursor-not-allowed"
                  : "border-[#7C0A1E]/40 bg-[#7C0A1E]/5 hover:bg-[#7C0A1E]/10 text-[#7C0A1E] dark:text-[#E8D3A2]"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#7C0A1E]" />
                  <span>Subiendo imagen...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Cargar desde PC</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="sm:col-span-1 text-center text-xs font-bold text-[#8E7D7D]">o</div>

          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="O pega una URL de imagen..."
              value={form.imagen_url}
              onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              className="input-base"
            />
          </div>
        </div>

        {form.imagen_url.trim() && (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#D9D0C7] dark:border-slate-700 bg-slate-900/10 mt-3 group">
            <img
              src={form.imagen_url}
              alt="Vista previa del local"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, imagen_url: "" })}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-md transition"
              >
                <X className="w-4 h-4" />
                <span>Quitar imagen</span>
              </button>
            </div>
            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
              Vista previa
            </span>
          </div>
        )}
      </div>

      {/* 4. Descripción */}
      <div className="space-y-1.5 w-full text-left">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
            Descripción y Servicios del Local
          </label>
          <span className="text-[11px] text-[#8E7D7D] font-medium">
            {form.descripcion.length} caracteres
          </span>
        </div>
        <textarea
          className="input-base min-h-[90px] w-full resize-y text-xs sm:text-sm leading-relaxed"
          rows={3}
          placeholder="Cuéntanos más sobre el local, especialidades, ambiente, pet-friendly o promociones para clientes..."
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFE7DE] dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setErrors({});
            setModalCrear(false);
          }}
          className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] dark:border-slate-700 text-[#5A4B4B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-xs sm:text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Crear local</span>
          )}
        </button>
      </div>
    </form>
  );

  const formEditar = (
    <form onSubmit={handleEditar} className="space-y-6">
      {/* 1. Datos Principales */}
      <div className="bg-[#FAF8F5]/80 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-[#EFE7DE] dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EFE7DE] dark:border-slate-800">
          <Store className="w-4 h-4 text-[#7C0A1E] dark:text-[#C5A059]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] dark:text-white">
            Identificación Comercial
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Razón Social *"
            value={form.razon_social}
            required
            error={errors.razon_social}
            onChange={(e) => {
              setForm({ ...form, razon_social: e.target.value });
              if (errors.razon_social) setErrors({ ...errors, razon_social: "" });
            }}
          />
          <Input label="RUC" value={form.ruc} disabled hint="No editable" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 w-full text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Categoría
            </label>
            <select
              className="input-base"
              value={form.categoria_id}
              onChange={(e) =>
                setForm({ ...form, categoria_id: e.target.value })
              }
            >
              <option value="">Sin categoría asignada</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icono_url ? `${c.icono_url} ` : "☕ "}{c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 w-full text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Puntos por Visita / Sello *
            </label>
            <input
              type="number"
              min="1"
              max="500"
              className="input-base font-black text-[#7C0A1E] dark:text-[#C5A059]"
              value={form.puntos_por_visita || 20}
              onChange={(e) =>
                setForm({ ...form, puntos_por_visita: Math.max(1, Number(e.target.value)) })
              }
              required
            />
          </div>

          <div className="space-y-1.5 w-full text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Estado Operativo
            </label>
            <select
              className="input-base"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 w-full text-left pt-1">
          <div className="flex items-center justify-between gap-2 pb-0.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
              Usuario Encargado (Cuenta COMERCIO)
            </label>
            <button
              type="button"
              onClick={() => setModalNuevoUsuario(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C0A1E] dark:text-[#E8D3A2] hover:underline cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Registrar nuevo usuario</span>
            </button>
          </div>

          {usuariosDisponibles.length === 0 ? (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                  Sin usuarios COMERCIO disponibles
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 truncate">
                  Todos los usuarios existentes ya están asignados a otros locales.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoUsuario(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear cuenta ahora</span>
              </button>
            </div>
          ) : (
            <select
              className="input-base"
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
            >
              <option value="">Sin usuario asignado</option>
              {usuariosDisponibles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombres} {u.apellidos} · {u.email}
                </option>
              ))}
            </select>
          )}

          <span className="text-[10px] text-muted block">
            Puedes cambiar o reasignar qué cuenta de comercio administra y valida las visitas de este local.
          </span>
        </div>
      </div>

      {/* 2. Ubicación del Lugar / Local */}
      <div className="bg-[#FAF8F5]/80 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-[#EFE7DE] dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EFE7DE] dark:border-slate-800">
          <MapPin className="w-4 h-4 text-[#7C0A1E] dark:text-[#C5A059]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] dark:text-white">
            Ubicación del Lugar / Local
          </h4>
        </div>

        <Input
          label="Dirección del Lugar / Local *"
          value={form.direccion}
          required
          error={errors.direccion}
          onChange={(e) => {
            setForm({ ...form, direccion: e.target.value });
            if (errors.direccion) setErrors({ ...errors, direccion: "" });
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Horario de Atención"
            value={form.horario}
            onChange={(e) => setForm({ ...form, horario: e.target.value })}
          />
          <Input
            label="Enlace Google Maps (Opcional)"
            placeholder="https://maps.app.goo.gl/... o https://maps.google.com/..."
            value={form.google_maps_url}
            error={errors.google_maps_url}
            onChange={(e) => {
              setForm({ ...form, google_maps_url: e.target.value });
              if (errors.google_maps_url)
                setErrors({ ...errors, google_maps_url: "" });
            }}
          />
        </div>
      </div>

      {/* 3. Foto / Portada */}
      <div className="bg-[#FAF8F5]/80 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-[#EFE7DE] dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE7DE] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#7C0A1E] dark:text-[#C5A059]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] dark:text-white">
              Fotografía del Local
            </h4>
          </div>
          <span className="text-[10px] text-[#8E7D7D]">JPG, PNG, WEBP (máx. 10 MB)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5">
            <label
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-xs font-bold cursor-pointer transition ${
                uploading
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-400 cursor-not-allowed"
                  : "border-[#7C0A1E]/40 bg-[#7C0A1E]/5 hover:bg-[#7C0A1E]/10 text-[#7C0A1E] dark:text-[#E8D3A2]"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#7C0A1E]" />
                  <span>Subiendo foto...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Subir nueva foto</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="sm:col-span-1 text-center text-xs font-bold text-[#8E7D7D]">o</div>

          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="O pega una URL de imagen..."
              value={form.imagen_url}
              onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              className="input-base"
            />
          </div>
        </div>

        {form.imagen_url.trim() && (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#D9D0C7] dark:border-slate-700 bg-slate-900/10 mt-3 group">
            <img
              src={form.imagen_url}
              alt="Vista previa del local"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, imagen_url: "" })}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-md transition"
              >
                <X className="w-4 h-4" />
                <span>Quitar imagen</span>
              </button>
            </div>
            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
              Vista previa
            </span>
          </div>
        )}
      </div>

      {/* 4. Descripción */}
      <div className="space-y-1.5 w-full text-left">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
          Descripción
        </label>
        <textarea
          className="input-base min-h-[85px] w-full resize-y text-xs sm:text-sm leading-relaxed"
          rows={3}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFE7DE] dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setErrors({});
            setModalEditar(false);
          }}
          className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] dark:border-slate-700 text-[#5A4B4B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-xs sm:text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar cambios</span>
          )}
        </button>
      </div>
    </form>
  );

  const formPersonal = (
    <form onSubmit={handleAsignarPersonal} className="space-y-4">
      <div className="bg-[#FAF8F5] dark:bg-slate-800/60 p-3.5 rounded-2xl border border-[#EFE7DE] dark:border-slate-700">
        <p className="text-xs text-[#8E7D7D] dark:text-slate-400">
          Lugar / Local seleccionado:
        </p>
        <p className="text-sm font-bold text-[#2D1A1E] dark:text-white mt-0.5">
          {localSeleccionado?.razon_social || localSeleccionado?.nombre}
        </p>
        {localSeleccionado?.usuario_encargado_email ? (
          <div className="mt-2.5 pt-2 border-t border-[#EFE7DE] dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#8E7D7D] dark:text-slate-400">Encargado actual:</span>
            <span className="text-xs font-semibold text-[#7C0A1E] dark:text-[#C5A059] truncate">
              {localSeleccionado.usuario_encargado_nombre} ({localSeleccionado.usuario_encargado_email})
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
            Sin personal asignado actualmente.
          </p>
        )}
      </div>

      <div className="space-y-1.5 w-full text-left">
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
            Seleccionar Usuario (Cuenta COMERCIO)
          </span>
          <button
            type="button"
            onClick={() => setModalNuevoUsuario(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C0A1E] dark:text-[#E8D3A2] hover:underline cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Registrar nuevo</span>
          </button>
        </div>

        {usuariosDisponibles.length === 0 ? (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                Sin usuarios disponibles
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 truncate">
                Todos los usuarios están asignados a otros locales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalNuevoUsuario(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear cuenta</span>
            </button>
          </div>
        ) : (
          <select
            className="input-base"
            value={staff}
            onChange={(e) => setStaff(e.target.value)}
          >
            <option value="">-- Sin encargado asignado / Desvincular --</option>
            {usuariosDisponibles.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombres} {u.apellidos} · {u.email}
              </option>
            ))}
          </select>
        )}

        <span className="text-[10px] text-muted block mt-1">
          Esta cuenta podrá ingresar al portal de Comercio, validar visitas NFC y canjear premios de este lugar / local.
        </span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={busy} fullWidth>
          Guardar Asignación
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
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#2D1A1E] dark:text-white">
          Gestión de eliminación para:{" "}
          <span className="text-[#7C0A1E] dark:text-[#E8D3A2]">
            {localSeleccionado?.razon_social || localSeleccionado?.nombre}
          </span>
        </p>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          {localSeleccionado?.usuario_encargado_email ? (
            <>
              Encargado actual vinculado:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {localSeleccionado.usuario_encargado_email}
              </strong>
            </>
          ) : (
            "Sin usuario comercio asignado actualmente."
          )}
        </p>
      </div>

      <div className="space-y-2.5">
        <label
          onClick={() => setModoEliminar("SOFT")}
          className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
            modoEliminar === "SOFT"
              ? "bg-[#7C0A1E]/5 border-[#7C0A1E] dark:border-[#C5A059] dark:bg-[#7C0A1E]/20"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
          }`}
        >
          <input
            type="radio"
            name="modoEliminar"
            checked={modoEliminar === "SOFT"}
            onChange={() => setModoEliminar("SOFT")}
            className="mt-0.5"
          />
          <div>
            <strong className="block text-slate-900 dark:text-white font-bold">
              Desactivar local (Recomendado)
            </strong>
            <span className="text-slate-500 dark:text-slate-400">
              Cambia el estado a INACTIVO. El usuario vinculado se mantiene intacto y se preserva el historial de visitas, sellos y puntos de clientes.
            </span>
          </div>
        </label>

        <label
          onClick={() => setModoEliminar("FORCE")}
          className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
            modoEliminar === "FORCE"
              ? "bg-rose-50 border-rose-500 dark:bg-rose-950/30 dark:border-rose-700"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
          }`}
        >
          <input
            type="radio"
            name="modoEliminar"
            checked={modoEliminar === "FORCE"}
            onChange={() => setModoEliminar("FORCE")}
            className="mt-0.5"
          />
          <div>
            <strong className="block text-rose-600 dark:text-rose-400 font-bold">
              Eliminar local permanentemente
            </strong>
            <span className="text-slate-500 dark:text-slate-400">
              Borra el local y desvincula a su usuario encargado (la cuenta del usuario no se elimina, queda libre para otro local).
            </span>
          </div>
        </label>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant={modoEliminar === "FORCE" ? "danger" : "primary"}
          loading={busy}
          fullWidth
          onClick={handleEliminar}
        >
          {modoEliminar === "SOFT" ? "Desactivar Local" : "Eliminar Definitivamente"}
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
          <h1 className="text-xl font-bold">Gestión de Lugares / Locales</h1>
          <p className="text-xs text-muted">
            Administra los comercios afiliados, direcciones, horarios y personal asignado
          </p>
        </div>
        <Button onClick={openCrear}>
          <Plus className="w-4 h-4" />
          Nuevo Lugar / Local
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E7D7D] pointer-events-none z-10" />
          <input
            className="input-base input-with-search"
            placeholder="Buscar por nombre, RUC o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-base w-full sm:w-44 text-xs font-semibold shrink-0"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos los estados</option>
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
          <div className="table-card-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EFE7DE]/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 text-muted font-bold uppercase">
                    <th className="p-3.5">Establecimiento / Razón Social</th>
                    <th className="p-3.5">RUC / Categoría</th>
                    <th className="p-3.5">Sello & Puntos</th>
                    <th className="p-3.5">Dirección</th>
                    <th className="p-3.5">Encargado (Comercio)</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DE]/60 dark:divide-slate-800/60">
                  {localesPaginados.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-500/5 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {l.imagen_url ? (
                            <img
                              src={l.imagen_url}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                              <Store className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <strong className="text-slate-900 dark:text-white font-semibold block truncate max-w-[200px]">
                              {l.razon_social}
                            </strong>
                            {l.nombre && l.nombre !== l.razon_social && (
                              <span className="text-[11px] text-muted truncate block max-w-[200px]">
                                {l.nombre}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-semibold block">{l.ruc}</span>
                        {l.categoria_nombre && (
                          <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                            <span>{l.categoria_icono || "🏷️"}</span>
                            <span>{l.categoria_nombre}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl shrink-0 select-none">
                            {(l as any).imagen_sello || l.categoria_icono || "🏛️"}
                          </span>
                          <div className="min-w-0">
                            <span className="font-black text-[#7C0A1E] dark:text-[#C5A059] text-xs block">
                              +{(l as any).puntos_por_visita || 20} pts
                            </span>
                            <span className="text-[10px] text-muted block truncate max-w-[120px]">
                              {(l as any).nombre_sello || "Sello Oficial"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-700 dark:text-slate-300">{l.direccion || "Sin dirección registrada"}</p>
                        {l.telefono && (
                          <p className="text-[10px] text-muted mt-0.5">{l.telefono}</p>
                        )}
                      </td>
                      <td className="p-3.5">
                        {l.usuario_encargado_email ? (
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {l.usuario_encargado_nombre || "Encargado"}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block truncate max-w-[170px]">
                              {l.usuario_encargado_email}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPersonal(l)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Sin asignar</span>
                          </button>
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
                            onClick={() => openVer(l)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditar(l)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition"
                            title="Editar local"
                          >
                            <SquarePen className="w-4 h-4" />
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
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                            title="Eliminar local"
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

            {/* Paginación y Resumen */}
            <div className="p-3.5 border-t border-[#EFE7DE]/70 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
        title="Nuevo Lugar / Local"
        subtitle="Registra un nuevo establecimiento aliado para emisión de sellos y visitas"
        size="xl"
      >
        {formCrear}
      </Modal>

      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Detalles del Lugar / Local"
        size="lg"
      >
        {localSeleccionado && (
          <div className="space-y-5">
            {/* Banner/Foto del Local si existe */}
            {localSeleccionado.imagen_url && (
              <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs relative bg-slate-100 dark:bg-slate-800">
                <img
                  src={localSeleccionado.imagen_url}
                  alt={localSeleccionado.razon_social}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    {localSeleccionado.razon_social}
                  </span>
                </div>
              </div>
            )}

            {/* Header del Local */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              {localSeleccionado.imagen_url ? (
                <img
                  src={localSeleccionado.imagen_url}
                  alt="Local"
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20 flex items-center justify-center shrink-0">
                  <Store className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {localSeleccionado.razon_social}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      localSeleccionado.estado === "ACTIVO"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        localSeleccionado.estado === "ACTIVO"
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />
                    {localSeleccionado.estado}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    RUC: {localSeleccionado.ruc}
                  </span>
                  {localSeleccionado.categoria_nombre && (
                    <span className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-500/20">
                      <span>{localSeleccionado.categoria_icono || "🏷️"}</span>
                      <span>{localSeleccionado.categoria_nombre}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sello Digital & Puntos Asignados */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-850 border border-[#EFE7DE] dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-[#EFE7DE] dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs shrink-0 select-none">
                  {(localSeleccionado as any).imagen_sello || localSeleccionado.categoria_icono || "🏛️"}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider block">
                    Sello Digital Vinculado
                  </span>
                  <h4 className="text-sm font-bold text-[#2D1A1E] dark:text-white truncate">
                    {(localSeleccionado as any).nombre_sello || "Sello Oficial"}
                  </h4>
                  <p className="text-[11px] text-[#8E7D7D] truncate">
                    Meta: {(localSeleccionado as any).meta_sellos || 8} sellos para completar pasaporte
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-[#8E7D7D] tracking-wider block">
                  Puntos por Visita
                </span>
                <span className="inline-block mt-0.5 px-3 py-1 rounded-xl bg-[#7C0A1E]/10 text-[#7C0A1E] dark:text-[#E8D3A2] dark:bg-[#7C0A1E]/30 font-black text-sm">
                  +{(localSeleccionado as any).puntos_por_visita || 20} pts
                </span>
              </div>
            </div>

            {/* Grid de Información de Contacto y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Dirección */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Dirección
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                    {localSeleccionado.direccion || "No registrada"}
                  </p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Teléfono
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {localSeleccionado.telefono ? (
                      <a
                        href={`tel:${localSeleccionado.telefono}`}
                        className="text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {localSeleccionado.telefono}
                      </a>
                    ) : (
                      "No registrado"
                    )}
                  </p>
                </div>
              </div>

              {/* Horario */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Horario de atención
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                    {localSeleccionado.horario || "No especificado"}
                  </p>
                </div>
              </div>

              {/* Usuario Encargado */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Usuario Encargado (Comercio)
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {localSeleccionado.usuario_encargado_nombre || "Sin usuario asignado"}
                  </p>
                  {localSeleccionado.usuario_encargado_email && (
                    <p className="text-[11px] text-muted font-mono truncate">
                      {localSeleccionado.usuario_encargado_email}
                    </p>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs sm:col-span-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Descripción del comercio
                </p>
                <p className="text-xs font-normal text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {localSeleccionado.descripcion || "Sin descripción proporcionada por el momento."}
                </p>
              </div>
            </div>

            {/* Google Maps Link Action */}
            {localSeleccionado.google_maps_url && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/70 dark:bg-teal-500/10 border border-teal-200/70 dark:border-teal-500/20">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 text-xs font-medium">
                  <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Ubicación GPS geolocalizada</span>
                </div>
                <a
                  href={localSeleccionado.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-2xs transition"
                >
                  <span>Abrir en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setModalVer(false)} variant="secondary" className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalEditar}
        onClose={() => {
          setErrors({});
          setModalEditar(false);
        }}
        title="Editar Lugar / Local"
        subtitle="Actualiza la información comercial, ubicación y estado operativo"
        size="xl"
      >
        {formEditar}
      </Modal>

      <Modal
        open={modalPersonal}
        onClose={() => setModalPersonal(false)}
        title="Asignar Encargado a Lugar / Local"
        size="sm"
      >
        {formPersonal}
      </Modal>

      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar o Desactivar Lugar / Local"
        size="sm"
      >
        {confirmarEliminar}
      </Modal>

      {/* Modal Crear Nuevo Usuario Encargado (Comercio) */}
      <Modal
        open={modalNuevoUsuario}
        onClose={() => setModalNuevoUsuario(false)}
        title="Nuevo Usuario Encargado (Comercio)"
        size="md"
      >
        <form onSubmit={handleCrearUsuarioRapido} className="space-y-4">
          <div className="bg-[#FAF8F5] dark:bg-slate-800/70 p-3.5 rounded-2xl border border-[#EFE7DE] dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C0A1E]/10 text-[#7C0A1E] dark:text-[#E8D3A2] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#2D1A1E] dark:text-white uppercase tracking-wider">
                Rol Automático: COMERCIO
              </h4>
              <p className="text-[11px] text-[#8E7D7D] dark:text-slate-400 mt-0.5 leading-snug">
                El usuario se registrará con acceso al portal de validación NFC y se seleccionará de inmediato como encargado de este local.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nombres *"
              placeholder="Ej: Carlos"
              value={nuevoUsuarioNombres}
              onChange={(e) => setNuevoUsuarioNombres(e.target.value)}
              required
            />
            <Input
              label="Apellidos *"
              placeholder="Ej: Mendoza"
              value={nuevoUsuarioApellidos}
              onChange={(e) => setNuevoUsuarioApellidos(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Correo Electrónico *"
              type="email"
              placeholder="encargado@comercio.com"
              value={nuevoUsuarioEmail}
              onChange={(e) => setNuevoUsuarioEmail(e.target.value)}
              required
            />
            <Input
              label="Teléfono Móvil (Opcional)"
              type="tel"
              placeholder="+51 987 654 321"
              value={nuevoUsuarioTelefono}
              onChange={(e) => setNuevoUsuarioTelefono(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
                Contraseña Temporal *
              </label>
              <button
                type="button"
                onClick={() => {
                  const pass = "Local" + Math.floor(1000 + Math.random() * 9000) + "!";
                  setNuevoUsuarioPassword(pass);
                }}
                className="text-[10px] font-semibold text-[#7C0A1E] dark:text-[#E8D3A2] hover:underline cursor-pointer"
              >
                Generar aleatoria
              </button>
            </div>
            <input
              type="text"
              className="input-base font-mono text-xs font-bold"
              value={nuevoUsuarioPassword}
              onChange={(e) => setNuevoUsuarioPassword(e.target.value)}
              required
            />
            <span className="text-[10px] text-muted block mt-1">
              Mínimo 6 caracteres. El usuario podrá cambiarla luego desde su perfil.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE7DE] dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalNuevoUsuario(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={creandoUsuario}
            >
              Crear y Asignar al Local
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
