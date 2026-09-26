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
} from "lucide-react";

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
  estado: EstadoNfc;
  fecha_asignacion?: string;
  fecha_bloqueo?: string;
  motivo_bloqueo?: string;
  usuario_id?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  created_at: string;
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
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaItem | null>(null);

  // Formulario de cambio de estado
  const [nuevoEstado, setNuevoEstado] = useState<EstadoNfc>("ACTIVA");
  const [motivoCambio, setMotivoCambio] = useState("");
  const [savingEstado, setSavingEstado] = useState(false);

  // Formulario importar stock
  const [uidsInput, setUidsInput] = useState("");
  const [savingStock, setSavingStock] = useState(false);

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

  useEffect(() => {
    loadTarjetas();
  }, []);

  const handleRegistrarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = uidsInput
      .split(/[\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!list.length) {
      showToast("Ingrese al menos un UID válido", "info");
      return;
    }

    setSavingStock(true);
    try {
      await api.post("/admin/tarjetas/stock", { uids: list });
      showToast(`${list.length} tarjetas registradas en almacén exitosamente`, "success");
      setUidsInput("");
      setModalStockOpen(false);
      await loadTarjetas();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al registrar lote", "error");
    } finally {
      setSavingStock(false);
    }
  };

  const openEditarEstado = (t: TarjetaItem) => {
    setSelectedTarjeta(t);
    // Normalizar a valor válido oficial
    const est = t.estado === "EN_STOCK" ? "DISPONIBLE" : t.estado === "ASIGNADA" ? "ACTIVA" : t.estado;
    setNuevoEstado(est as EstadoNfc);
    setMotivoCambio(t.motivo_bloqueo || "");
    setModalEstadoOpen(true);
  };

  const handleGuardarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarjeta) return;

    setSavingEstado(true);
    try {
      await api.patch(`/admin/tarjetas/${selectedTarjeta.id}/estado`, {
        estado: nuevoEstado,
        motivo: motivoCambio.trim() || undefined,
      });

      showToast(`Estado de tarjeta actualizado a ${nuevoEstado}`, "success");

      setTarjetas((prev) =>
        prev.map((t) =>
          t.id === selectedTarjeta.id
            ? { ...t, estado: nuevoEstado, motivo_bloqueo: motivoCambio }
            : t,
        ),
      );

      if (selectedTarjeta.id === selectedTarjeta.id) {
        setSelectedTarjeta((prev) =>
          prev ? { ...prev, estado: nuevoEstado, motivo_bloqueo: motivoCambio } : null,
        );
      }

      setModalEstadoOpen(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al actualizar estado", "error");
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
          <span>Importar Lote NFC</span>
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
                          {/* Botón Ver */}
                          <button
                            type="button"
                            onClick={() => openVer(t)}
                            className="p-2 rounded-xl text-[#736868] hover:text-[#2D1A1E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Ver ficha completa"
                          >
                            <Eye className="w-4 h-4" />
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
            {/* Resumen de la tarjeta */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#EFE7DE] dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#8E7D7D]">UID Chip NFC</p>
                <p className="font-mono font-bold text-sm text-[#2D1A1E] dark:text-white">
                  {selectedTarjeta.uid_nfc}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-[#8E7D7D]">Titular</p>
                <p className="text-xs font-semibold text-[#2D1A1E] dark:text-white">
                  {selectedTarjeta.nombres ? `${selectedTarjeta.nombres} ${selectedTarjeta.apellidos || ""}` : "Sin asignar"}
                </p>
              </div>
            </div>

            {/* Opciones de los 6 estados oficiales */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-400">
                Selecciona el nuevo estado de la tarjeta:
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

            <div className="pt-2 flex justify-between items-center border-t border-[#EFE7DE] dark:border-slate-800">
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
      {/* MODAL 3: IMPORTAR LOTE NFC                                */}
      {/* ========================================================= */}
      <Modal
        open={modalStockOpen}
        onClose={() => setModalStockOpen(false)}
        title="Importar Lote de Tarjetas NFC"
        subtitle="Registra chips NTAG físicos en el inventario oficial"
        size="lg"
      >
        <form onSubmit={handleRegistrarStock} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#736868] dark:text-slate-300">
              Ingresa los UIDs de las tarjetas (uno por línea o separados por coma) *
            </label>
            <textarea
              required
              rows={6}
              value={uidsInput}
              onChange={(e) => setUidsInput(e.target.value)}
              placeholder={"04:5A:2B:1A:3C:60:80\n04:6B:3C:2D:4E:70:91\n04:7C:4D:3E:5F:81:A2"}
              className="input-base font-mono text-xs"
            />
            <p className="text-[11px] text-[#8E7D7D] mt-1">
              Las tarjetas se ingresarán con estado <strong>DISPONIBLE</strong>. UIDs duplicados se omiten de forma segura.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EFE7DE] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalStockOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[#D9D0C7] text-[#5A4B4B] font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingStock}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {savingStock ? <Spinner size={16} /> : <span>Registrar en Almacén</span>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
