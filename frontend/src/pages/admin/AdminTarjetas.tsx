import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { useUI } from "../../hooks/useUI";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
  XCircle,
  FileText,
  QrCode,
  Download,
  Copy,
  UserPlus,
  UserCheck,
  UserX,
  Wifi,
  Smartphone,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { useNFCReader } from "../../hooks/useNFCReader";

export type EstadoNfc =
  | "DISPONIBLE"
  | "ACTIVA"
  | "BLOQUEADA"
  | "PERDIDA"
  | "DANADA"
  | "REEMPLAZADA"
  | "EN_STOCK"
  | "ASIGNADA";

interface TarjetaItem {
  id: string | number;
  uid_nfc: string;
  codigo_interno?: string;
  qr_respaldo?: string;
  estado: EstadoNfc;
  fecha_asignacion?: string;
  fecha_activacion?: string;
  fecha_bloqueo?: string;
  motivo_bloqueo?: string;
  usuario_id?: string;
  id_usuario?: string | number;
  id_cliente?: string | number;
  codigo_cliente?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  created_at: string;
}

interface ClienteOption {
  id: string | number;
  id_cliente?: string | number;
  codigo_cliente?: string;
  nombres: string;
  apellidos?: string;
  email: string;
  total_sellos?: number;
  puntos_globales?: number;
  estado?: string;
  id_tarjeta_activa?: string | number;
  tarjeta_activa_uid?: string;
}

const ITEMS_PER_PAGE = 10;

const ESTADOS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string; desc: string }
> = {
  DISPONIBLE: {
    label: "En Almacén",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    desc: "Tarjeta libre en stock físico, lista para ser vinculada",
  },
  EN_STOCK: {
    label: "En Almacén",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
    desc: "Tarjeta libre en stock físico",
  },
  ACTIVA: {
    label: "Activa / Asignada",
    badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/20",
    dot: "bg-sky-500",
    desc: "Vinculada a un cliente, válida para visitas y puntos",
  },
  ASIGNADA: {
    label: "Activa / Asignada",
    badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/20",
    dot: "bg-sky-500",
    desc: "Vinculada a un cliente",
  },
  BLOQUEADA: {
    label: "Bloqueada",
    badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20",
    dot: "bg-rose-500",
    desc: "Restringida temporalmente por seguridad o solicitud",
  },
  PERDIDA: {
    label: "Extraviada / Robada",
    badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20",
    dot: "bg-amber-500",
    desc: "Reportada como perdida por el usuario",
  },
  DANADA: {
    label: "Dañada / Defectuosa",
    badge: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/60 dark:border-orange-500/20",
    dot: "bg-orange-500",
    desc: "Chip NFC desgastado o fisura en antena",
  },
  REEMPLAZADA: {
    label: "Reemplazada",
    badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-500/20",
    dot: "bg-purple-500",
    desc: "Sustituida por otra tarjeta, inhabilitada permanentemente",
  },
};

export const AdminTarjetas: React.FC = () => {
  const [tarjetas, setTarjetas] = useState<TarjetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [modalStockOpen, setModalStockOpen] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
  const [modalQrOpen, setModalQrOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Asignación de cliente
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOption | null>(null);
  const [savingAsignacion, setSavingAsignacion] = useState(false);

  // Formulario de cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState<EstadoNfc>("ACTIVA");
  const [editarUidInput, setEditarUidInput] = useState("");
  const [motivoCambio, setMotivoCambio] = useState("");
  const [savingEstado, setSavingEstado] = useState(false);

  // Formulario importar stock
  const [tipoRegistroStock, setTipoRegistroStock] = useState<"ESCANER" | "MANUAL">("ESCANER");
  const [tarjetasEscaneadas, setTarjetasEscaneadas] = useState<string[]>([]);
  const [singleUidInput, setSingleUidInput] = useState("");
  const [uidsInput, setUidsInput] = useState("");
  const [savingStock, setSavingStock] = useState(false);

  // Hook Web NFC
  const {
    isScanning: isNfcScanning,
    isSupported: isNfcSupported,
    error: nfcReaderError,
    startScan: startNfcScan,
    stopScan: stopNfcScan,
  } = useNFCReader();

  const { showToast } = useUI();

  const loadTarjetas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/tarjetas");
      const list = data?.data ?? data ?? [];
      setTarjetas(Array.isArray(list) ? list : []);
    } catch {
      showToast("Error al cargar inventario de tarjetas", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    setLoadingClientes(true);
    try {
      const { data } = await api.get("/admin/usuarios", { params: { rol: "CLIENTE" } });
      const list = data?.data ?? data ?? [];
      setClientes(Array.isArray(list) ? list : []);
    } catch {
      // Silencioso o con toast suave
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    loadTarjetas();
    loadClientes();
  }, []);

  const openAsignarModal = (t: TarjetaItem) => {
    setSelectedTarjeta(t);
    setBusquedaCliente("");
    // Si ya tiene cliente asignado, pre-seleccionarlo
    if (t.id_usuario || t.email) {
      const actual = clientes.find(
        (c) => String(c.id) === String(t.id_usuario) || c.email === t.email
      );
      setClienteSeleccionado(actual || null);
    } else {
      setClienteSeleccionado(null);
    }
    setModalAsignarOpen(true);
  };

  const handleGuardarAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarjeta) return;
    if (!clienteSeleccionado) {
      showToast("Por favor selecciona un cliente de la lista", "info");
      return;
    }

    setSavingAsignacion(true);
    try {
      await api.patch(`/admin/tarjetas/${selectedTarjeta.id}/asignar`, {
        id_cliente: clienteSeleccionado.id_cliente || undefined,
        id_usuario: clienteSeleccionado.id,
      });

      showToast(`Tarjeta ${selectedTarjeta.uid_nfc} asignada exitosamente a ${clienteSeleccionado.nombres}`, "success");

      setTarjetas((prev) =>
        prev.map((card) =>
          card.id === selectedTarjeta.id
            ? {
                ...card,
                estado: "ACTIVA",
                id_cliente: clienteSeleccionado.id_cliente,
                id_usuario: clienteSeleccionado.id,
                codigo_cliente: clienteSeleccionado.codigo_cliente,
                nombres: clienteSeleccionado.nombres,
                apellidos: clienteSeleccionado.apellidos,
                email: clienteSeleccionado.email,
              }
            : card
        )
      );

      if (selectedTarjeta) {
        setSelectedTarjeta((prev) =>
          prev
            ? {
                ...prev,
                estado: "ACTIVA",
                id_cliente: clienteSeleccionado.id_cliente,
                id_usuario: clienteSeleccionado.id,
                codigo_cliente: clienteSeleccionado.codigo_cliente,
                nombres: clienteSeleccionado.nombres,
                apellidos: clienteSeleccionado.apellidos,
                email: clienteSeleccionado.email,
              }
            : null
        );
      }

      setModalAsignarOpen(false);
      await loadTarjetas();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al asignar la tarjeta al cliente", "error");
    } finally {
      setSavingAsignacion(false);
    }
  };

  const handleDesvincularTarjeta = async () => {
    if (!selectedTarjeta) return;
    if (!window.confirm(`¿Estás seguro de desvincular la tarjeta ${selectedTarjeta.uid_nfc}? Volverá a estar DISPONIBLE en almacén.`)) {
      return;
    }

    setSavingAsignacion(true);
    try {
      await api.patch(`/admin/tarjetas/${selectedTarjeta.id}/asignar`, {
        desvincular: true,
      });

      showToast("Tarjeta desvinculada exitosamente. Ahora está DISPONIBLE en almacén.", "success");

      setTarjetas((prev) =>
        prev.map((card) =>
          card.id === selectedTarjeta.id
            ? {
                ...card,
                estado: "DISPONIBLE",
                id_cliente: undefined,
                id_usuario: undefined,
                codigo_cliente: undefined,
                nombres: undefined,
                apellidos: undefined,
                email: undefined,
              }
            : card
        )
      );

      if (selectedTarjeta) {
        setSelectedTarjeta((prev) =>
          prev
            ? {
                ...prev,
                estado: "DISPONIBLE",
                id_cliente: undefined,
                id_usuario: undefined,
                codigo_cliente: undefined,
                nombres: undefined,
                apellidos: undefined,
                email: undefined,
              }
            : null
        );
      }

      setModalAsignarOpen(false);
      await loadTarjetas();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al desvincular la tarjeta", "error");
    } finally {
      setSavingAsignacion(false);
    }
  };

  const openVerQr = async (t: TarjetaItem) => {
    setSelectedTarjeta(t);
    const code = t.qr_respaldo || t.codigo_interno || t.uid_nfc;
    try {
      const url = await QRCode.toDataURL(code, {
        width: 320,
        margin: 2,
        color: {
          dark: "#2D1A1E",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(url);
      setModalQrOpen(true);
    } catch {
      showToast("No se pudo generar el código QR", "error");
    }
  };

  const handleDescargarQr = () => {
    if (!qrDataUrl || !selectedTarjeta) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR_Respaldo_${selectedTarjeta.codigo_interno || selectedTarjeta.uid_nfc}.png`;
    a.click();
    showToast("QR descargado exitosamente", "success");
  };

  const handleCopiarCodigoQr = () => {
    if (!selectedTarjeta) return;
    const code = selectedTarjeta.qr_respaldo || selectedTarjeta.codigo_interno || selectedTarjeta.uid_nfc;
    navigator.clipboard.writeText(code);
    showToast("Código copiado al portapapeles", "success");
  };

  const handleAgregarUidEscaneado = (uid: string) => {
    const clean = uid.trim().toUpperCase();
    if (!clean) return;

    // Verificar si ya existe en la base de datos (inventario actual cargado)
    const yaExisteEnBaseDatos = tarjetas.find((t) => t.uid_nfc?.toUpperCase() === clean);
    if (yaExisteEnBaseDatos) {
      showToast(`Esta tarjeta (${clean}) ya está registrada en el sistema`, "error");
      setSingleUidInput("");
      return;
    }

    if (tarjetasEscaneadas.includes(clean)) {
      showToast(`Esta tarjeta ya está en la lista de escaneo`, "info");
      setSingleUidInput("");
      return;
    }
    setTarjetasEscaneadas((prev) => [clean, ...prev]);
    setSingleUidInput("");
    showToast(`Tarjeta ${clean} capturada`, "success");
  };

  const handleEliminarUidEscaneado = (uid: string) => {
    setTarjetasEscaneadas((prev) => prev.filter((item) => item !== uid));
  };

  const handleRegistrarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    stopNfcScan();

    let list: string[] = [];
    if (tipoRegistroStock === "ESCANER") {
      list = [...tarjetasEscaneadas];
      if (singleUidInput.trim()) {
        const extra = singleUidInput.trim().toUpperCase();
        if (!list.includes(extra)) list.unshift(extra);
      }
    } else {
      list = uidsInput
        .split(/[\n,;]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    }

    if (!list.length) {
      showToast("Ingrese o escanee al menos un UID de tarjeta", "info");
      return;
    }

    setSavingStock(true);
    try {
      const { data } = await api.post("/admin/tarjetas/stock", { uids: list });
      const insertadas = data?.data?.insertadas ?? 0;
      const totalEnviadas = list.length;
      const duplicadas = totalEnviadas - insertadas;

      if (insertadas === 0 && duplicadas > 0) {
        showToast("Esta tarjeta ya está registrada en el sistema", "error");
      } else if (duplicadas > 0) {
        showToast(`Se registraron ${insertadas} tarjeta(s). ${duplicadas} ya estaban registradas.`, "info");
      } else {
        showToast(`${insertadas} tarjeta(s) registrada(s) en almacén exitosamente`, "success");
      }

      setUidsInput("");
      setTarjetasEscaneadas([]);
      setSingleUidInput("");
      setModalStockOpen(false);
      await loadTarjetas();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al registrar tarjeta(s)", "error");
    } finally {
      setSavingStock(false);
    }
  };

  const openEditarEstado = (t: TarjetaItem) => {
    setSelectedTarjeta(t);
    // Normalizar a valor válido oficial
    const est = t.estado === "EN_STOCK" ? "DISPONIBLE" : t.estado === "ASIGNADA" ? "ACTIVA" : t.estado;
    setNuevoEstado(est as EstadoNfc);
    setEditarUidInput(t.uid_nfc || "");
    setMotivoCambio(t.motivo_bloqueo || "");
    setModalEstadoOpen(true);
  };

  const handleGuardarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarjeta) return;

    const uidLimpio = editarUidInput.trim().toUpperCase();
    if (!uidLimpio) {
      showToast("El UID de la tarjeta no puede estar vacío", "error");
      return;
    }

    setSavingEstado(true);
    try {
      const { data } = await api.patch(`/admin/tarjetas/${selectedTarjeta.id}/estado`, {
        estado: nuevoEstado,
        uid_nfc: uidLimpio,
        motivo: motivoCambio.trim() || undefined,
      });

      const updatedCard = data?.data || data;
      const finalUid = updatedCard?.uid_nfc || uidLimpio;

      showToast(`Tarjeta ${finalUid} actualizada exitosamente`, "success");

      setTarjetas((prev) =>
        prev.map((t) =>
          t.id === selectedTarjeta.id
            ? { ...t, uid_nfc: finalUid, estado: nuevoEstado, motivo_bloqueo: motivoCambio }
            : t,
        ),
      );

      setSelectedTarjeta((prev) =>
        prev ? { ...prev, uid_nfc: finalUid, estado: nuevoEstado, motivo_bloqueo: motivoCambio } : null,
      );

      setModalEstadoOpen(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al actualizar tarjeta", "error");
    } finally {
      setSavingEstado(false);
    }
  };

  const handleToggleRapido = async (t: TarjetaItem) => {
    const siguienteEstado: EstadoNfc =
      t.estado === "BLOQUEADA" ? "ACTIVA" : "BLOQUEADA";
    const motivo =
      siguienteEstado === "BLOQUEADA"
        ? "Bloqueo preventivo por administrador"
        : "Reactivación por administrador";

    try {
      await api.patch(`/admin/tarjetas/${t.id}/estado`, {
        estado: siguienteEstado,
        motivo,
      });
      showToast(
        siguienteEstado === "BLOQUEADA" ? "Tarjeta bloqueada" : "Tarjeta activada",
        "success",
      );
      setTarjetas((prev) =>
        prev.map((card) =>
          card.id === t.id ? { ...card, estado: siguienteEstado, motivo_bloqueo: motivo } : card,
        ),
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al cambiar estado", "error");
    }
  };

  const openVer = (t: TarjetaItem) => {
    setSelectedTarjeta(t);
    setModalVer(true);
  };

  const filtradas = useMemo(() => {
    let result = tarjetas;
    if (filtroEstado !== "TODOS") {
      result = result.filter((t) => {
        if (filtroEstado === "DISPONIBLE") return t.estado === "DISPONIBLE" || t.estado === "EN_STOCK";
        if (filtroEstado === "ACTIVA") return t.estado === "ACTIVA" || t.estado === "ASIGNADA";
        return t.estado === filtroEstado;
      });
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (t) =>
          t.uid_nfc.toLowerCase().includes(q) ||
          (t.codigo_interno && t.codigo_interno.toLowerCase().includes(q)) ||
          (t.nombres && `${t.nombres} ${t.apellidos || ""}`.toLowerCase().includes(q)) ||
          (t.email && t.email.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [tarjetas, busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const tarjetasPaginadas = filtradas.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado]);

  const countStock = tarjetas.filter((t) => t.estado === "DISPONIBLE" || t.estado === "EN_STOCK").length;
  const countAsignadas = tarjetas.filter((t) => t.estado === "ACTIVA" || t.estado === "ASIGNADA").length;
  const countBloqueadas = tarjetas.filter((t) => t.estado === "BLOQUEADA").length;
  const countOtras = tarjetas.filter((t) => ["PERDIDA", "DANADA", "REEMPLAZADA"].includes(t.estado)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7C0A1E] dark:text-[#C5A059] font-bold text-xs tracking-wider uppercase">
            <CreditCard className="w-4 h-4" />
            <span>Hardware & Credenciales NFC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D1A1E] dark:text-white mt-1">
            Inventario de Tarjetas NFC
          </h1>
          <p className="text-xs text-[#736868] dark:text-slate-400 mt-0.5">
            Gestión completa del ciclo de vida de chips NFC, cambios de estado, asignación y auditoría
          </p>
        </div>

        <button
          onClick={() => setModalStockOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white text-xs font-bold shadow-md active:scale-98 transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Tarjetas NFC</span>
        </button>
      </div>

      {/* Métricas de Inventario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-[#EFE7DE] dark:border-slate-800 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E7D7D]">Total Tarjetas</p>
          <p className="text-2xl font-black text-[#2D1A1E] dark:text-white mt-1">{tarjetas.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-[#EFE7DE] dark:border-slate-800 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">En Almacén</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{countStock}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-[#EFE7DE] dark:border-slate-800 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Activas / Clientes</p>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{countAsignadas}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-[#EFE7DE] dark:border-slate-800 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Bloqueadas / Incidencias</p>
          <p className="text-2xl font-black text-rose-500 mt-1">{countBloqueadas + countOtras}</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-[#EFE7DE]/70 dark:border-slate-800/80 backdrop-blur-xs rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#8E7D7D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por UID, código interno o cliente..."
            className="input-base input-with-search"
          />
        </div>

        {/* Pestañas de filtro por estado */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-[#FAF8F5] dark:bg-slate-800/60 rounded-xl border border-[#EFE7DE]/80 dark:border-slate-700/60">
          {[
            { id: "TODOS", label: "Todas" },
            { id: "DISPONIBLE", label: "Almacén" },
            { id: "ACTIVA", label: "Activas" },
            { id: "BLOQUEADA", label: "Bloqueadas" },
            { id: "PERDIDA", label: "Extraviadas" },
            { id: "DANADA", label: "Dañadas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filtroEstado === tab.id
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "text-[#736868] dark:text-slate-300 hover:text-[#2D1A1E] hover:bg-white/60 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Tarjetas */}
      <div className="table-card-container rounded-3xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size={32} />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-[#D9D0C7] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#2D1A1E] dark:text-white">
              No se encontraron tarjetas
            </h3>
            <p className="text-xs text-[#8E7D7D] mt-1">
              Prueba con otro término de búsqueda o importa un nuevo lote de tarjetas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] dark:bg-slate-800/80 border-b border-[#EFE7DE] dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Tarjeta NFC</th>
                  <th className="py-3.5 px-4 text-center">Estado Actual</th>
                  <th className="py-3.5 px-4">Cliente Asignado</th>
                  <th className="py-3.5 px-4 text-center">Fecha Alta</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE] dark:divide-slate-800">
                {tarjetasPaginadas.map((t) => {
                  const cfg = ESTADOS_CONFIG[t.estado] || ESTADOS_CONFIG.DISPONIBLE;
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-[#FAF8F5]/60 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* UID y Código */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#EFE7DE] dark:border-slate-700 flex items-center justify-center text-[#7C0A1E] dark:text-[#C5A059] shrink-0 font-bold">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-[#2D1A1E] dark:text-white text-xs">
                              {t.uid_nfc}
                            </p>
                            <p className="text-[10px] text-[#8E7D7D] font-mono">
                              ID: #{t.id} {t.codigo_interno ? `• ${t.codigo_interno}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Estado con Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditarEstado(t)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition hover:opacity-85 cursor-pointer ${cfg.badge}`}
                          title="Clic para editar estado"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </button>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.nombres ? (
                          <div>
                            <p className="font-bold text-[#2D1A1E] dark:text-white text-xs">
                              {t.nombres} {t.apellidos || ""}
                            </p>
                            <p className="text-[11px] text-[#7C0A1E] dark:text-[#C5A059]">{t.email}</p>
                          </div>
                        ) : (
                          <span className="text-[#8E7D7D] italic text-xs">Sin asignar (En inventario)</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap text-xs text-[#736868] dark:text-slate-300">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botón Ver QR */}
                          <button
                            type="button"
                            onClick={() => openVerQr(t)}
                            className="p-2 rounded-xl text-[#7C0A1E] dark:text-[#E8D3A2] hover:bg-[#7C0A1E]/10 transition cursor-pointer"
                            title="Ver código QR de respaldo"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Botón Ver */}
                          <button
                            type="button"
                            onClick={() => openVer(t)}
                            className="p-2 rounded-xl text-[#736868] hover:text-[#2D1A1E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Ver ficha completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Botón Asignar / Cambiar Cliente */}
                          <button
                            type="button"
                            onClick={() => openAsignarModal(t)}
                            className="px-2.5 py-1 text-[#C5A059] hover:bg-[#C5A059]/10 rounded-lg text-xs font-bold border border-[#C5A059]/30 transition flex items-center gap-1 cursor-pointer"
                            title={t.nombres ? "Reasignar o cambiar cliente" : "Asignar a un cliente"}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{t.nombres ? "Reasignar" : "Asignar"}</span>
                          </button>

                          {/* Botón Editar Estado (Abre el Modal de Estados) */}
                          <button
                            type="button"
                            onClick={() => openEditarEstado(t)}
                            className="px-2.5 py-1 text-[#7C0A1E] dark:text-[#E8D3A2] hover:bg-[#7C0A1E]/10 rounded-lg text-xs font-bold border border-[#7C0A1E]/20 transition flex items-center gap-1 cursor-pointer"
                            title="Modificar estado de la tarjeta"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Editar Estado</span>
                          </button>

                          {/* Acción rápida Bloquear / Desbloquear */}
                          {t.estado === "ACTIVA" || t.estado === "ASIGNADA" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRapido(t)}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                              title="Bloqueo preventivo rápido"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Bloquear</span>
                            </button>
                          ) : t.estado === "BLOQUEADA" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRapido(t)}
                              className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer"
                              title="Reactivar tarjeta"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Reactivar</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {filtradas.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-[#EFE7DE] dark:border-slate-800 bg-[#FAF8F5]/60 flex items-center justify-between text-xs">
            <span className="text-[#8E7D7D]">
              Página <strong className="text-[#2D1A1E]">{paginaActual}</strong> de <strong>{totalPaginas}</strong>
            </span>
            <div className="flex gap-2">
              <button
                disabled={paginaActual <= 1}
                onClick={() => setPagina((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#D9D0C7] text-[#5A4B4B] disabled:opacity-40 hover:bg-white text-xs font-bold transition cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#D9D0C7] text-[#5A4B4B] disabled:opacity-40 hover:bg-white text-xs font-bold transition cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: EDITAR ESTADO DE TARJETA NFC                     */}
      {/* ========================================================= */}
      <Modal
        open={modalEstadoOpen}
        onClose={() => setModalEstadoOpen(false)}
        title="Modificar Estado de Tarjeta NFC"
        subtitle={`Tarjeta UID: ${selectedTarjeta?.uid_nfc || ""}`}
        size="lg"
      >
        {selectedTarjeta && (
          <form onSubmit={handleGuardarEstado} className="space-y-5">
            {/* Resumen y edición de UID de la tarjeta */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#EFE7DE] dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#8E7D7D]">ID Interno</p>
                  <p className="font-mono text-xs text-[#2D1A1E] dark:text-white">
                    {selectedTarjeta.codigo_interno || `ID-${selectedTarjeta.id}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-[#8E7D7D]">Titular</p>
                  <p className="text-xs font-semibold text-[#2D1A1E] dark:text-white">
                    {selectedTarjeta.nombres ? `${selectedTarjeta.nombres} ${selectedTarjeta.apellidos || ""}` : "Sin asignar"}
                  </p>
                </div>
              </div>

              {/* Input editable de UID NFC con lector rápido */}
              <div className="space-y-1.5 text-left pt-1 border-t border-[#EFE7DE] dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
                    UID del Chip NFC (Modificable / Escanear nuevo chip):
                  </label>
                  {isNfcSupported && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isNfcScanning) {
                          stopNfcScan();
                          return;
                        }
                        void startNfcScan(
                          (result) => {
                            if (result.serialNumber) {
                              setEditarUidInput(result.serialNumber.trim().toUpperCase());
                              showToast(`Nuevo chip ${result.serialNumber} detectado`, "success");
                            }
                          },
                          { autoStop: true }
                        );
                      }}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isNfcScanning
                          ? "bg-amber-600 text-white animate-pulse"
                          : "bg-[#7C0A1E]/10 text-[#7C0A1E] hover:bg-[#7C0A1E]/20"
                      }`}
                    >
                      <Smartphone size={13} />
                      <span>{isNfcScanning ? "Escaneando tarjeta..." : "Escanear con Celular"}</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editarUidInput}
                    onChange={(e) => setEditarUidInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const clean = editarUidInput.trim().toUpperCase();
                        setEditarUidInput(clean);
                        showToast(`UID fijado: ${clean}`, "info");
                      }
                    }}
                    placeholder="Ej: 04:79:BA:71:CF:2A:81 o acerca la tarjeta al lector USB"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#D9D0C7] dark:border-slate-700 text-xs font-mono font-bold text-[#2D1A1E] dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:border-[#7C0A1E] uppercase"
                  />
                  {editarUidInput && editarUidInput !== selectedTarjeta.uid_nfc && (
                    <button
                      type="button"
                      onClick={() => setEditarUidInput(selectedTarjeta.uid_nfc)}
                      className="px-3 py-2 text-[11px] font-bold text-[#8E7D7D] hover:text-[#2D1A1E] border border-[#EFE7DE] rounded-xl"
                      title="Restablecer UID original"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#8E7D7D]">
                  Puedes acercar la nueva tarjeta física al <strong>lector USB</strong> o pulsar <strong>Escanear con Celular</strong> para capturarla en un segundo.
                </p>
              </div>
            </div>

            {/* Opciones de los 6 estados oficiales */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
                Selecciona el estado de la tarjeta:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "DISPONIBLE",
                    label: "🟢 En Almacén (Disponible)",
                    desc: "Stock libre para asignar a cualquier cliente",
                  },
                  {
                    id: "ACTIVA",
                    label: "🔵 Activa / Asignada",
                    desc: "Operativa para acumular sellos y puntos",
                  },
                  {
                    id: "BLOQUEADA",
                    label: "🔴 Bloqueada (Preventivo)",
                    desc: "Inhabilitada temporalmente en lectores NFC",
                  },
                  {
                    id: "PERDIDA",
                    label: "🟡 Extraviada / Robada",
                    desc: "Reportada como perdida por el titular",
                  },
                  {
                    id: "DANADA",
                    label: "🟠 Dañada / Inservible",
                    desc: "Chip deteriorado o averiado físicamente",
                  },
                  {
                    id: "REEMPLAZADA",
                    label: "🟣 Reemplazada",
                    desc: "Sustituida permanentemente por otra tarjeta",
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-start gap-3 ${
                      nuevoEstado === opt.id
                        ? "border-[#7C0A1E] bg-[#7C0A1E]/5 ring-2 ring-[#7C0A1E]/20"
                        : "border-[#D9D0C7] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="nuevoEstado"
                      value={opt.id}
                      checked={nuevoEstado === opt.id}
                      onChange={() => setNuevoEstado(opt.id as EstadoNfc)}
                      className="mt-1 accent-[#7C0A1E]"
                    />
                    <div>
                      <p className="font-bold text-xs text-[#2D1A1E] dark:text-white">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-[#8E7D7D] dark:text-slate-400 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Motivo o justificación */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
                Motivo u Observación (Auditoría):
              </label>
              <input
                type="text"
                value={motivoCambio}
                onChange={(e) => setMotivoCambio(e.target.value)}
                placeholder="Ej: Reporte del cliente vía soporte, tarjeta rota, etc."
                className="input-base"
              />
              <p className="text-[10px] text-[#8E7D7D]">
                Quedará registrado permanentemente en el historial de trazabilidad de la tarjeta.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE7DE] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalEstadoOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] dark:border-slate-700 text-[#5A4B4B] font-bold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEstado}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {savingEstado ? <Spinner size={16} /> : <span>Guardar Estado</span>}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: VER FICHA DETALLADA                              */}
      {/* ========================================================= */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Ficha Técnica de Tarjeta NFC"
        subtitle={`UID: ${selectedTarjeta?.uid_nfc || ""}`}
        size="lg"
      >
        {selectedTarjeta && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#EFE7DE] dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C0A1E] to-[#580614] flex items-center justify-center text-white shadow-md">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono text-[#2D1A1E] dark:text-white">
                    {selectedTarjeta.uid_nfc}
                  </h3>
                  <p className="text-xs text-[#8E7D7D]">
                    ID #{selectedTarjeta.id} {selectedTarjeta.codigo_interno ? `• Código: ${selectedTarjeta.codigo_interno}` : ""}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  (ESTADOS_CONFIG[selectedTarjeta.estado] || ESTADOS_CONFIG.DISPONIBLE).badge
                }`}
              >
                {(ESTADOS_CONFIG[selectedTarjeta.estado] || ESTADOS_CONFIG.DISPONIBLE).label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-[#EFE7DE] dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-[#8E7D7D] mb-1">Cliente Vinculado</p>
                {selectedTarjeta.nombres ? (
                  <div>
                    <p className="font-bold text-[#2D1A1E] dark:text-white text-sm">
                      {selectedTarjeta.nombres} {selectedTarjeta.apellidos || ""}
                    </p>
                    <p className="text-xs text-[#7C0A1E] font-medium mt-0.5">{selectedTarjeta.email}</p>
                  </div>
                ) : (
                  <p className="text-[#8E7D7D] italic">Sin usuario asignado (Disponible en almacén)</p>
                )}
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-[#EFE7DE] dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-[#8E7D7D] mb-1">Fecha de Alta</p>
                <p className="font-bold text-[#2D1A1E] dark:text-slate-200 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8E7D7D]" />
                  {selectedTarjeta.created_at
                    ? new Date(selectedTarjeta.created_at).toLocaleString()
                    : "—"}
                </p>
              </div>

              {selectedTarjeta.motivo_bloqueo && (
                <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 sm:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Motivo Registrado</p>
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">
                    {selectedTarjeta.motivo_bloqueo}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-[#EFE7DE] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openVerQr(selectedTarjeta)}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-700/50 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Ver QR Respaldo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalVer(false);
                    openAsignarModal(selectedTarjeta);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 font-bold text-xs border border-[#C5A059]/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{selectedTarjeta.nombres ? "Reasignar Cliente" : "Asignar Cliente"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalVer(false);
                    openEditarEstado(selectedTarjeta);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#7C0A1E]/10 text-[#7C0A1E] font-bold text-xs hover:bg-[#7C0A1E]/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Modificar Estado</span>
                </button>
              </div>

              <button
                onClick={() => setModalVer(false)}
                className="px-5 py-2 rounded-xl border border-[#D9D0C7] text-[#5A4B4B] font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL QR: CÓDIGO QR DE RESPALDO                           */}
      {/* ========================================================= */}
      <Modal
        open={modalQrOpen}
        onClose={() => setModalQrOpen(false)}
        title="Código QR de Respaldo"
        subtitle={`Tarjeta UID: ${selectedTarjeta?.uid_nfc || ""}`}
        size="md"
      >
        {selectedTarjeta && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-[#736868] dark:text-slate-300">
              Este QR sirve como alternativa de validación para comercios o locales si el usuario no porta la tarjeta física NFC.
            </p>

            <div className="flex justify-center p-4 bg-white rounded-2xl border-2 border-[#EFE7DE] shadow-inner max-w-xs mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Respaldo"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <Spinner size={32} />
                </div>
              )}
            </div>

            <div className="p-3 bg-[#FAF8F5] dark:bg-slate-800/80 rounded-xl border border-[#EFE7DE] dark:border-slate-700 max-w-sm mx-auto text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8E7D7D] font-bold uppercase text-[10px]">Código asignado:</span>
                <button
                  type="button"
                  onClick={handleCopiarCodigoQr}
                  className="text-[#7C0A1E] dark:text-[#E8D3A2] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-[#2D1A1E] dark:text-white mt-1 break-all">
                {selectedTarjeta.qr_respaldo || selectedTarjeta.codigo_interno || selectedTarjeta.uid_nfc}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3 border-t border-[#EFE7DE] dark:border-slate-800">
              <button
                type="button"
                onClick={handleDescargarQr}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] text-white font-bold text-xs shadow hover:bg-[#600616] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PNG</span>
              </button>

              <button
                type="button"
                onClick={() => setModalQrOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#D9D0C7] text-[#5A4B4B] font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: REGISTRAR / IMPORTAR TARJETAS NFC               */}
      {/* ========================================================= */}
      <Modal
        open={modalStockOpen}
        onClose={() => {
          stopNfcScan();
          setModalStockOpen(false);
        }}
        title="Registrar Tarjetas NFC en Almacén"
        subtitle="Agrega tarjetas físicas al inventario oficial para su posterior asignación"
        size="lg"
      >
        <div className="space-y-4">
          {/* Selector de Modo: Escáner vs Manual */}
          <div className="flex bg-[#FAF8F5] p-1 rounded-2xl border border-[#EFE7DE] gap-1">
            <button
              type="button"
              onClick={() => setTipoRegistroStock("ESCANER")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                tipoRegistroStock === "ESCANER"
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E]"
              }`}
            >
              <Wifi size={14} className="rotate-90" />
              <span>Lector NFC / Celular</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopNfcScan();
                setTipoRegistroStock("MANUAL");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                tipoRegistroStock === "MANUAL"
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E]"
              }`}
            >
              <FileText size={14} />
              <span>Pegar Lote de UIDs</span>
            </button>
          </div>

          <form onSubmit={handleRegistrarStock} className="space-y-4">
            {tipoRegistroStock === "ESCANER" ? (
              <div className="space-y-4">
                {/* Botón de Web NFC móvil si es compatible */}
                {isNfcSupported && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isNfcScanning) {
                          stopNfcScan();
                          return;
                        }
                        void startNfcScan(
                          (result) => {
                            if (result.serialNumber) {
                              handleAgregarUidEscaneado(result.serialNumber);
                            }
                          },
                          { autoStop: false }
                        );
                      }}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                        isNfcScanning
                          ? "bg-amber-600 text-white animate-pulse"
                          : "bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] text-white hover:bg-[#600616]"
                      }`}
                    >
                      <Smartphone size={16} />
                      <span>
                        {isNfcScanning
                          ? "Escuchando NFC... acerca tarjetas al teléfono (Click para pausar)"
                          : "Activar lector NFC del teléfono para captura continua"}
                      </span>
                    </button>
                    {nfcReaderError && (
                      <p className="text-xs text-[#7C0A1E] font-medium mt-1">{nfcReaderError}</p>
                    )}
                  </div>
                )}

                {/* Input de captura con lector USB o teclado */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
                    Captura por Lector USB o Ingreso Individual:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Acerca la tarjeta al lector USB o escribe UID y presiona Enter..."
                      value={singleUidInput}
                      onChange={(e) => setSingleUidInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (singleUidInput.trim()) {
                            handleAgregarUidEscaneado(singleUidInput);
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-mono font-bold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E] bg-[#FAF8F5]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (singleUidInput.trim()) {
                          handleAgregarUidEscaneado(singleUidInput);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] cursor-pointer"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de tarjetas capturadas */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#736868]">
                      Tarjetas capturadas para registrar ({tarjetasEscaneadas.length}):
                    </span>
                    {tarjetasEscaneadas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTarjetasEscaneadas([])}
                        className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Limpiar lista
                      </button>
                    )}
                  </div>

                  {tarjetasEscaneadas.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#D9D0C7] text-center text-xs text-[#8E7D7D]">
                      Aún no hay tarjetas en la lista. Acerca una tarjeta física al lector o teléfono para capturarla.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto p-2 bg-[#FAF8F5] rounded-2xl border border-[#EFE7DE] space-y-1.5 custom-scrollbar">
                      {tarjetasEscaneadas.map((uid, idx) => (
                        <div
                          key={uid + idx}
                          className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-[#EFE7DE] text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#7C0A1E]/10 text-[#7C0A1E] font-bold text-[10px] flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="font-mono font-bold text-[#2D1A1E]">{uid}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEliminarUidEscaneado(uid)}
                            className="text-[#8E7D7D] hover:text-rose-600 p-1 rounded-lg transition"
                            title="Quitar de la lista"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
                  Ingresa los UIDs de las tarjetas (uno por línea o separados por coma) *
                </label>
                <textarea
                  required={tipoRegistroStock === "MANUAL"}
                  rows={6}
                  value={uidsInput}
                  onChange={(e) => setUidsInput(e.target.value)}
                  placeholder={"04:5A:2B:1A:3C:60:80\n04:6B:3C:2D:4E:70:91\n04:7C:4D:3E:5F:81:A2"}
                  className="w-full p-3 rounded-2xl border border-[#EFE7DE] font-mono text-xs text-[#2D1A1E] bg-[#FAF8F5] focus:outline-none focus:border-[#7C0A1E]"
                />
                <p className="text-[11px] text-[#8E7D7D] mt-1">
                  Las tarjetas se ingresarán con estado <strong>DISPONIBLE</strong>. UIDs duplicados se omiten de forma segura.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#EFE7DE] dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  stopNfcScan();
                  setModalStockOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] text-[#5A4B4B] font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingStock || (tipoRegistroStock === "ESCANER" && tarjetasEscaneadas.length === 0 && !singleUidInput.trim())}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingStock ? <Spinner size={16} /> : <span>Guardar en Almacén</span>}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: ASIGNAR / VINCULAR A CLIENTE                     */}
      {/* ========================================================= */}
      <Modal
        open={modalAsignarOpen}
        onClose={() => setModalAsignarOpen(false)}
        title="Asignar Tarjeta NFC a Cliente"
        subtitle={`Tarjeta UID: ${selectedTarjeta?.uid_nfc || ""}`}
        size="lg"
      >
        {selectedTarjeta && (
          <form onSubmit={handleGuardarAsignacion} className="space-y-4">
            {/* Resumen de la Tarjeta */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#EFE7DE] dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C0A1E] to-[#9B1B30] text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono font-bold text-xs text-[#2D1A1E] dark:text-white">
                    {selectedTarjeta.uid_nfc}
                  </p>
                  <p className="text-[11px] text-[#8E7D7D] font-mono">
                    ID #{selectedTarjeta.id} {selectedTarjeta.codigo_interno ? `• ${selectedTarjeta.codigo_interno}` : ""}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  (ESTADOS_CONFIG[selectedTarjeta.estado] || ESTADOS_CONFIG.DISPONIBLE).badge
                }`}
              >
                {(ESTADOS_CONFIG[selectedTarjeta.estado] || ESTADOS_CONFIG.DISPONIBLE).label}
              </span>
            </div>

            {/* Asignación Actual (si tiene) */}
            {selectedTarjeta.nombres && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Actualmente asignada a: {selectedTarjeta.nombres} {selectedTarjeta.apellidos || ""}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      {selectedTarjeta.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDesvincularTarjeta}
                  disabled={savingAsignacion}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Liberar tarjeta y regresar al almacén como DISPONIBLE"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Desvincular</span>
                </button>
              </div>
            )}

            {/* Buscador de clientes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
                  Selecciona el Cliente a quien asignar esta tarjeta:
                </label>
                <span className="text-[10px] text-[#8E7D7D] font-medium">
                  Solo clientes sin tarjeta activa
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#8E7D7D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido, código o email..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  style={{ paddingLeft: "2.75rem" }}
                  className="input-base text-xs w-full"
                />
              </div>

              {/* Lista scrolleable de Clientes */}
              <div className="max-h-60 overflow-y-auto divide-y divide-[#EFE7DE] dark:divide-slate-800 border border-[#EFE7DE] dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                {loadingClientes ? (
                  <div className="p-6 text-center">
                    <Spinner size={24} />
                    <p className="text-xs text-[#8E7D7D] mt-2">Cargando clientes disponibles...</p>
                  </div>
                ) : (() => {
                  const q = busquedaCliente.toLowerCase().trim();
                  // Filtrar: solo clientes que NO tienen tarjeta activa asignada, o el cliente actual de esta tarjeta
                  const filtrados = clientes.filter((c) => {
                    const esTitularActual =
                      (selectedTarjeta.id_usuario && String(c.id) === String(selectedTarjeta.id_usuario)) ||
                      (selectedTarjeta.email && c.email === selectedTarjeta.email);

                    // Si ya tiene otra tarjeta activa asignada y no es esta, se excluye
                    if (c.id_tarjeta_activa && !esTitularActual) {
                      return false;
                    }

                    if (!q) return true;
                    const nombreCompleto = `${c.nombres || ""} ${c.apellidos || ""}`.toLowerCase();
                    const email = (c.email || "").toLowerCase();
                    const cod = (c.codigo_cliente || "").toLowerCase();
                    return nombreCompleto.includes(q) || email.includes(q) || cod.includes(q);
                  });

                  if (filtrados.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-[#8E7D7D]">
                        No hay clientes disponibles sin tarjeta que coincidan con la búsqueda.
                      </div>
                    );
                  }

                  return filtrados.slice(0, 50).map((cli) => {
                    const isSelected = clienteSeleccionado?.id === cli.id;
                    const esTitularActual =
                      (selectedTarjeta.id_usuario && String(cli.id) === String(selectedTarjeta.id_usuario)) ||
                      (selectedTarjeta.email && cli.email === selectedTarjeta.email);

                    return (
                      <div
                        key={cli.id}
                        onClick={() => setClienteSeleccionado(cli)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? "bg-[#7C0A1E]/10 dark:bg-[#7C0A1E]/20"
                            : "hover:bg-[#FAF8F5] dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? "bg-[#7C0A1E] text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-[#736868] dark:text-slate-300"
                            }`}
                          >
                            <User className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-[#2D1A1E] dark:text-white flex items-center gap-1.5">
                              <span>{cli.nombres} {cli.apellidos || ""}</span>
                              {esTitularActual && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  Titular Actual
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#8E7D7D]">
                              {cli.email} {cli.codigo_cliente ? `• ${cli.codigo_cliente}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {cli.puntos_globales !== undefined && (
                            <span className="text-[11px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md">
                              {cli.puntos_globales} pts
                            </span>
                          )}
                          <input
                            type="radio"
                            name="clienteSelectRadio"
                            checked={isSelected}
                            onChange={() => setClienteSeleccionado(cli)}
                            className="accent-[#7C0A1E] w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {clienteSeleccionado && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Cliente seleccionado: <strong>{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos || ""}</strong> ({clienteSeleccionado.email})
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#8E7D7D]">
              Al confirmar, la tarjeta pasará al estado <strong>ACTIVA</strong> y se vinculará a la cuenta del usuario para registrar visitas, sellos y recompensas.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#EFE7DE] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalAsignarOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] text-[#5A4B4B] font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingAsignacion || !clienteSeleccionado}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingAsignacion ? <Spinner size={16} /> : <span>Confirmar Asignación</span>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
