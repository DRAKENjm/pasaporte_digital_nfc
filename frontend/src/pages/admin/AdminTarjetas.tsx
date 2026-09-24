import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { useUI } from "../../hooks/useUI";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Layers,
  X,
  UploadCloud,
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

export const AdminTarjetas: React.FC = () => {
  const [tarjetas, setTarjetas] = useState<TarjetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  
  // Modal registro en lote
  const [modalStockOpen, setModalStockOpen] = useState(false);
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
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al actualizar estado", "error");
    }
  };

  const filtradas = tarjetas.filter((t) => {
    const q = busqueda.toLowerCase();
    const matchesQuery =
      t.uid_nfc.toLowerCase().includes(q) ||
      (t.nombres && `${t.nombres} ${t.apellidos || ""}`.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q));
    const matchesEstado = filtroEstado ? t.estado === filtroEstado : true;
    return matchesQuery && matchesEstado;
  });

  const countStock = tarjetas.filter((t) => t.estado === "EN_STOCK").length;
  const countAsignadas = tarjetas.filter((t) => t.estado === "ASIGNADA").length;
  const countBloqueadas = tarjetas.filter((t) => ["BLOQUEADA", "EXTRAVIADA"].includes(t.estado)).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgb(var(--app-border))] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-700" />
            Inventario de Tarjetas NFC
          </h1>
          <p className="text-xs text-muted">
            Control de stock físico de chips NTAG, asignaciones a clientes y bloqueos de seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalStockOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Importar Lote NFC
        </button>
      </div>

      {/* Métricas de Inventario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-xl">
          <p className="text-[11px] font-semibold text-muted">Total Registradas</p>
          <p className="text-xl font-bold mt-0.5">{tarjetas.length}</p>
        </div>
        <div className="p-3.5 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-xl">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">En Stock (Disponibles)</p>
          <p className="text-xl font-bold mt-0.5 text-emerald-700 dark:text-emerald-400">{countStock}</p>
        </div>
        <div className="p-3.5 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-xl">
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">Asignadas a Clientes</p>
          <p className="text-xl font-bold mt-0.5 text-sky-700 dark:text-sky-400">{countAsignadas}</p>
        </div>
        <div className="p-3.5 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-xl">
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Bloqueadas / Extraviadas</p>
          <p className="text-xl font-bold mt-0.5 text-rose-700 dark:text-rose-400">{countBloqueadas}</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por UID NFC (ej: 04:5A:...), cliente o correo..."
            className="w-full pl-9 pr-4 py-2 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-xl text-xs font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-xl text-xs font-semibold"
          >
            <option value="">Todos los Estados</option>
            <option value="EN_STOCK">En Stock</option>
            <option value="ASIGNADA">Asignada</option>
            <option value="EXTRAVIADA">Extraviada</option>
            <option value="BLOQUEADA">Bloqueada</option>
          </select>
        </div>
      </div>

      {/* Tabla de Inventario */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="p-12 text-center border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))]">
          <CreditCard className="w-10 h-10 text-muted mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No se encontraron tarjetas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900/50 text-muted font-bold uppercase">
                  <th className="p-3.5">UID Físico NFC</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Portador / Asignado</th>
                  <th className="p-3.5">Fecha Asignación</th>
                  <th className="p-3.5 text-right">Acción de Seguridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--app-border))]">
                {filtradas.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-500/5 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {t.uid_nfc}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.estado === "EN_STOCK"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : t.estado === "ASIGNADA"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {t.nombres ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {t.nombres} {t.apellidos || ""}
                          </p>
                          <p className="text-[10px] text-muted">{t.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted italic">Disponible en almacén</span>
                      )}
                    </td>
                    <td className="p-3.5 text-muted">
                      {t.fecha_asignacion
                        ? new Date(t.fecha_asignacion).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3.5 text-right">
                      {t.estado === "ASIGNADA" ? (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(t.id, "BLOQUEADA")}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold border border-rose-200 transition"
                        >
                          Bloquear
                        </button>
                      ) : t.estado === "BLOQUEADA" ? (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(t.id, "ASIGNADA")}
                          className="px-2.5 py-1 text-sky-600 hover:bg-sky-50 rounded-lg text-xs font-semibold border border-sky-200 transition"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted font-mono">En stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTACIÓN EN LOTE */}
      {modalStockOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[rgb(var(--app-border))] pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-sky-700" />
                Importar Lote de Tarjetas NFC
              </h2>
              <button
                type="button"
                onClick={() => setModalStockOpen(false)}
                className="p-1 text-muted hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegistrarStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Ingrese los UIDs de las tarjetas (uno por línea o separados por coma) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={uidsInput}
                  onChange={(e) => setUidsInput(e.target.value)}
                  placeholder={"04:5A:2B:1A:3C:60:80\n04:6B:3C:2D:4E:70:91\n04:7C:4D:3E:5F:81:A2"}
                  className="w-full p-3 rounded-xl border border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-muted mt-1">
                  Los UIDs duplicados serán omitidos automáticamente para evitar colisiones.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalStockOpen(false)}
                  className="px-4 py-2 border border-[rgb(var(--app-border))] rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="px-5 py-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                >
                  {savingStock ? "Guardando..." : "Registrar en Almacén"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
