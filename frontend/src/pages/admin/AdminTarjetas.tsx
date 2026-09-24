import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { useUI } from "../../hooks/useUI";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  QrCode,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface TarjetaItem {
  id: string;
  uid_nfc: string;
  qr_respaldo?: string;
  estado: "EN_STOCK" | "ASIGNADA" | "EXTRAVIADA" | "BLOQUEADA";
  fecha_asignacion?: string;
  usuario_id?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export const AdminTarjetas: React.FC = () => {
  const [tarjetas, setTarjetas] = useState<TarjetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [modalStockOpen, setModalStockOpen] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaItem | null>(null);

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
      .map((s) => s.trim())
      .filter(Boolean);

    if (!list.length) {
      showToast("Ingrese al menos un UID válido", "info");
      return;
    }

    setSavingStock(true);
    try {
      await api.post("/admin/tarjetas/stock", { uids: list });
      showToast(`${list.length} tarjetas registradas en stock exitosamente`, "success");
      setUidsInput("");
      setModalStockOpen(false);
      await loadTarjetas();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al registrar lote", "error");
    } finally {
      setSavingStock(false);
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      await api.patch(`/admin/tarjetas/${id}/estado`, { estado: nuevoEstado });
      showToast(`Estado de tarjeta actualizado a ${nuevoEstado}`, "success");
      setTarjetas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado as any } : t)),
      );
      if (selectedTarjeta && selectedTarjeta.id === id) {
        setSelectedTarjeta((prev) => (prev ? { ...prev, estado: nuevoEstado as any } : null));
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al actualizar estado", "error");
    }
  };

  const openVer = (t: TarjetaItem) => {
    setSelectedTarjeta(t);
    setModalVer(true);
  };

  const filtradas = useMemo(() => {
    let result = tarjetas;
    if (filtroEstado !== "TODOS") {
      result = result.filter((t) => t.estado === filtroEstado);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (t) =>
          t.uid_nfc.toLowerCase().includes(q) ||
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

  const countStock = tarjetas.filter((t) => t.estado === "EN_STOCK").length;
  const countAsignadas = tarjetas.filter((t) => t.estado === "ASIGNADA").length;
  const countBloqueadas = tarjetas.filter((t) => ["BLOQUEADA", "EXTRAVIADA"].includes(t.estado)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <CreditCard className="w-4 h-4" />
            <span>Hardware & Credenciales</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Inventario de Tarjetas NFC
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control de stock físico de chips NTAG, asignaciones a clientes y bloqueos de seguridad
          </p>
        </div>

        <Button
          onClick={() => setModalStockOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs text-xs font-semibold px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Importar Lote NFC
        </Button>
      </div>

      {/* Métricas de Inventario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Tarjetas</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tarjetas.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">En Almacén / Stock</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{countStock}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">Asignadas a Clientes</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{countAsignadas}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">Bloqueadas / Extraviadas</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{countBloqueadas}</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por UID NFC, cliente o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["TODOS", "EN_STOCK", "ASIGNADA", "BLOQUEADA"].map((tab) => (
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
              {tab === "TODOS"
                ? "Todas"
                : tab === "EN_STOCK"
                ? "En Stock"
                : tab === "ASIGNADA"
                ? "Asignadas"
                : "Bloqueadas"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Tarjetas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="text-xs text-slate-400 mt-3 font-medium">Cargando inventario de chips...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={CreditCard}
              title="No se encontraron tarjetas"
              description={
                busqueda || filtroEstado !== "TODOS"
                  ? "Prueba ajustando los filtros de búsqueda"
                  : "Importa tu primer lote de chips NFC para comenzar"
              }
              actionLabel={!busqueda && filtroEstado === "TODOS" ? "Importar Lote NFC" : undefined}
              onAction={!busqueda && filtroEstado === "TODOS" ? () => setModalStockOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">UID Físico NFC</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4">Portador Asignado</th>
                  <th className="py-3.5 px-4 text-center">Fecha Asignación</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tarjetasPaginadas.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* UID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {t.uid_nfc}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: {t.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          t.estado === "EN_STOCK"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                            : t.estado === "ASIGNADA"
                            ? "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-500/20"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.estado === "EN_STOCK"
                              ? "bg-emerald-500"
                              : t.estado === "ASIGNADA"
                              ? "bg-teal-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {t.estado === "EN_STOCK"
                          ? "En Almacén"
                          : t.estado === "ASIGNADA"
                          ? "Asignada"
                          : "Bloqueada"}
                      </span>
                    </td>

                    {/* Asignado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.nombres ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">
                            {t.nombres} {t.apellidos || ""}
                          </p>
                          <p className="text-[11px] text-slate-400">{t.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Disponible en almacén</span>
                      )}
                    </td>

                    {/* Fecha Asignación */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {t.fecha_asignacion ? new Date(t.fecha_asignacion).toLocaleDateString() : "—"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openVer(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {t.estado === "ASIGNADA" ? (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(t.id, "BLOQUEADA")}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-800 transition flex items-center gap-1"
                            title="Bloquear por extravío o seguridad"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bloquear</span>
                          </button>
                        ) : t.estado === "BLOQUEADA" ? (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(t.id, "ASIGNADA")}
                            className="px-2.5 py-1 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg text-xs font-semibold border border-teal-200 dark:border-teal-800 transition flex items-center gap-1"
                            title="Desbloquear tarjeta"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Desbloquear</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, filtradas.length)} -{" "}
                {Math.min(paginaActual * ITEMS_PER_PAGE, filtradas.length)} de{" "}
                <strong className="text-slate-900 dark:text-white">{filtradas.length}</strong> tarjetas
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
        )}
      </div>

      {/* Modal Ver Detalles */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Ficha de Tarjeta NFC"
        size="md"
      >
        {selectedTarjeta && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white truncate">
                  {selectedTarjeta.uid_nfc}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID Sistema: {selectedTarjeta.id}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  selectedTarjeta.estado === "EN_STOCK"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : selectedTarjeta.estado === "ASIGNADA"
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                }`}
              >
                {selectedTarjeta.estado}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Usuario Vinculado</p>
                {selectedTarjeta.nombres ? (
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      {selectedTarjeta.nombres} {selectedTarjeta.apellidos || ""}
                    </p>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5">{selectedTarjeta.email}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Sin usuario asignado (En inventario)</p>
                )}
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha de Asignación</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {selectedTarjeta.fecha_asignacion
                    ? new Date(selectedTarjeta.fecha_asignacion).toLocaleDateString()
                    : "No asignada aún"}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 sm:col-span-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha de Ingreso al Almacén</p>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(selectedTarjeta.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button onClick={() => setModalVer(false)} variant="secondary" className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Importar Lote */}
      <Modal
        open={modalStockOpen}
        onClose={() => setModalStockOpen(false)}
        title="Importar Lote de Tarjetas NFC"
        size="md"
      >
        <form onSubmit={handleRegistrarStock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Ingrese los UIDs de las tarjetas (uno por línea o separados por coma) *
            </label>
            <textarea
              required
              rows={6}
              value={uidsInput}
              onChange={(e) => setUidsInput(e.target.value)}
              placeholder={"04:5A:2B:1A:3C:60:80\n04:6B:3C:2D:4E:70:91\n04:7C:4D:3E:5F:81:A2"}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Los UIDs duplicados serán omitidos automáticamente para evitar colisiones.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalStockOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={savingStock}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
            >
              {savingStock ? <Spinner size={16} /> : "Registrar en Almacén"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
