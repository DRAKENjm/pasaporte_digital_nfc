import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Building2,
  User,
  Mail,
  Phone,
  Send,
  X,
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";

interface ReclamoItem {
  id: string;
  codigo_seguimiento: string;
  usuario_id?: string;
  establecimiento_id?: string;
  establecimiento_nombre?: string;
  nombres_reclamante: string;
  apellidos_reclamante: string;
  tipo_documento: string;
  numero_documento: string;
  email: string;
  telefono?: string;
  direccion?: string;
  tipo_bien_contratado: string;
  tipo_registro: string;
  monto_reclamado: number;
  detalle: string;
  pedido_consumidor: string;
  estado: "PENDIENTE" | "EN_PROCESO" | "ATENDIDO" | "RECHAZADO";
  respuesta_admin?: string;
  fecha_respuesta?: string;
  admin_responsable_nombre?: string;
  created_at: string;
}

export const AdminReclamaciones: React.FC = () => {
  const { showToast } = useUI();
  const [reclamos, setReclamos] = useState<ReclamoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");

  // Modal de atención / respuesta
  const [selectedReclamo, setSelectedReclamo] = useState<ReclamoItem | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<"ATENDIDO" | "RECHAZADO" | "EN_PROCESO">("ATENDIDO");
  const [savingRespuesta, setSavingRespuesta] = useState(false);

  const fetchReclamos = async () => {
    setLoading(true);
    try {
      const url = filtroEstado ? `/claims?estado=${filtroEstado}` : "/claims";
      const res = await api.get(url);
      const list = res.data?.data ?? res.data ?? [];
      setReclamos(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al cargar reclamaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamos();
  }, [filtroEstado]);

  const handleOpenResponder = (item: ReclamoItem) => {
    setSelectedReclamo(item);
    setRespuestaTexto(item.respuesta_admin || "");
    setNuevoEstado(item.estado === "PENDIENTE" ? "ATENDIDO" : (item.estado as any));
  };

  const handleGuardarRespuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReclamo) return;
    if (!respuestaTexto.trim()) {
      showToast("Debe ingresar la respuesta formal para el reclamante.", "error");
      return;
    }

    setSavingRespuesta(true);
    try {
      await api.patch(`/claims/${selectedReclamo.id}/responder`, {
        respuesta_admin: respuestaTexto.trim(),
        estado: nuevoEstado,
      });
      showToast("Respuesta guardada y reclamo actualizado.", "success");
      setSelectedReclamo(null);
      fetchReclamos();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo actualizar el reclamo", "error");
    } finally {
      setSavingRespuesta(false);
    }
  };

  const filtrados = reclamos.filter((r) => {
    const q = busqueda.toLowerCase();
    return (
      r.codigo_seguimiento.toLowerCase().includes(q) ||
      `${r.nombres_reclamante} ${r.apellidos_reclamante}`.toLowerCase().includes(q) ||
      r.numero_documento.includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.establecimiento_nombre && r.establecimiento_nombre.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgb(var(--app-border))] pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-600" />
            Libro de Reclamaciones
          </h1>
          <p className="text-xs text-muted">
            Gestión, auditoría y resolución de quejas y reclamos legales de usuarios y clientes.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, reclamante, documento o local..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-sm"
          >
            <option value="">Todos los Estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="ATENDIDO">Atendidos</option>
            <option value="RECHAZADO">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Listado / Tabla */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="p-12 text-center border border-[rgb(var(--app-border))] rounded-2xl bg-[rgb(var(--app-surface))]">
          <FileText className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">No se encontraron registros en el Libro de Reclamaciones</p>
          <p className="text-xs text-muted mt-1">Todas las reclamaciones de los usuarios aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgb(var(--app-border))] bg-slate-50 dark:bg-slate-900/50 text-muted font-bold uppercase">
                  <th className="p-3.5">Código / Fecha</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Reclamante</th>
                  <th className="p-3.5">Local Asociado</th>
                  <th className="p-3.5">Monto</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--app-border))]">
                {filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-500/5 transition">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                        {item.codigo_seguimiento}
                      </span>
                      <p className="text-[10px] text-muted">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="p-3.5 font-bold">
                      <span className={item.tipo_registro === "RECLAMO" ? "text-sky-600" : "text-amber-600"}>
                        {item.tipo_registro}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-[rgb(var(--app-text))]">
                        {item.nombres_reclamante} {item.apellidos_reclamante}
                      </p>
                      <p className="text-[10px] text-muted">
                        {item.tipo_documento}: {item.numero_documento} • {item.email}
                      </p>
                    </td>
                    <td className="p-3.5 text-muted">
                      {item.establecimiento_nombre || "Plataforma General"}
                    </td>
                    <td className="p-3.5 font-mono">
                      {item.monto_reclamado > 0 ? `S/. ${Number(item.monto_reclamado).toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.estado === "ATENDIDO"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : item.estado === "EN_PROCESO"
                            ? "bg-sky-500/15 text-sky-600"
                            : item.estado === "RECHAZADO"
                            ? "bg-rose-500/15 text-rose-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenResponder(item)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg text-xs transition"
                      >
                        {item.estado === "ATENDIDO" ? "Ver / Editar" : "Atender"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALLE Y RESPUESTA */}
      {selectedReclamo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[rgb(var(--app-surface))] border border-[rgb(var(--app-border))] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-[rgb(var(--app-border))] flex items-center justify-between sticky top-0 bg-[rgb(var(--app-surface))]">
              <div>
                <span className="font-mono text-xs font-bold text-violet-600">
                  {selectedReclamo.codigo_seguimiento}
                </span>
                <h2 className="text-base font-bold">Detalle de {selectedReclamo.tipo_registro}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReclamo(null)}
                className="p-2 text-muted hover:text-[rgb(var(--app-text))]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Resumen del consumidor */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[rgb(var(--app-border))] space-y-1.5">
                <p className="font-bold text-[rgb(var(--app-text))]">
                  {selectedReclamo.nombres_reclamante} {selectedReclamo.apellidos_reclamante}
                </p>
                <p className="text-muted">
                  {selectedReclamo.tipo_documento}: {selectedReclamo.numero_documento} | Email: {selectedReclamo.email} | Tel: {selectedReclamo.telefono || "No especificado"}
                </p>
                {selectedReclamo.direccion && <p className="text-muted">Dirección: {selectedReclamo.direccion}</p>}
                <p className="text-muted">
                  Destino: <strong>{selectedReclamo.establecimiento_nombre || "Plataforma General"}</strong> | Bien: <strong>{selectedReclamo.tipo_bien_contratado}</strong>
                </p>
              </div>

              <div>
                <p className="font-bold text-muted uppercase tracking-wider mb-1">Hechos y Detalle Reclamado</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[rgb(var(--app-border))] text-xs whitespace-pre-wrap">
                  {selectedReclamo.detalle}
                </div>
              </div>

              <div>
                <p className="font-bold text-muted uppercase tracking-wider mb-1">Pedido Concreto del Consumidor</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[rgb(var(--app-border))] text-xs whitespace-pre-wrap">
                  {selectedReclamo.pedido_consumidor}
                </div>
              </div>

              {/* Formulario de Respuesta */}
              <form onSubmit={handleGuardarRespuesta} className="pt-3 border-t border-[rgb(var(--app-border))] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs">Respuesta Formal de la Administración *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted">Estado:</span>
                    <select
                      value={nuevoEstado}
                      onChange={(e: any) => setNuevoEstado(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-[rgb(var(--app-border))] bg-transparent text-xs font-semibold"
                    >
                      <option value="ATENDIDO">ATENDIDO (Resuelto)</option>
                      <option value="EN_PROCESO">EN PROCESO</option>
                      <option value="RECHAZADO">RECHAZADO (Improcedente)</option>
                    </select>
                  </div>
                </div>

                <textarea
                  required
                  rows={4}
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  placeholder="Redacte la respuesta legal/administrativa que se notificará al consumidor..."
                  className="w-full p-3 rounded-xl border border-[rgb(var(--app-border))] bg-transparent text-xs focus:ring-2 focus:ring-violet-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReclamo(null)}
                    className="px-4 py-2 border border-[rgb(var(--app-border))] rounded-xl text-xs font-semibold hover:bg-slate-500/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingRespuesta}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {savingRespuesta ? "Guardando..." : "Emitir Respuesta Formal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
