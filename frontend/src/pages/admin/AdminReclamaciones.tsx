import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  Send,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Scale,
  MapPin,
  Calendar,
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";

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

const ITEMS_PER_PAGE = 10;

export const AdminReclamaciones: React.FC = () => {
  const { showToast } = useUI();
  const [reclamos, setReclamos] = useState<ReclamoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [selectedReclamo, setSelectedReclamo] = useState<ReclamoItem | null>(null);
  const [modalVer, setModalVer] = useState(false);
  const [modalResponder, setModalResponder] = useState(false);

  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<"ATENDIDO" | "RECHAZADO" | "EN_PROCESO">("ATENDIDO");
  const [savingRespuesta, setSavingRespuesta] = useState(false);

  const fetchReclamos = async () => {
    setLoading(true);
    try {
      const url = filtroEstado && filtroEstado !== "TODOS" ? `/claims?estado=${filtroEstado}` : "/claims";
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

  const openVer = (item: ReclamoItem) => {
    setSelectedReclamo(item);
    setModalVer(true);
  };

  const openResponder = (item: ReclamoItem) => {
    setSelectedReclamo(item);
    setRespuestaTexto(item.respuesta_admin || "");
    setNuevoEstado(item.estado === "PENDIENTE" ? "ATENDIDO" : (item.estado as any));
    setModalResponder(true);
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
      setModalResponder(false);
      setSelectedReclamo(null);
      await fetchReclamos();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "No se pudo actualizar el reclamo", "error");
    } finally {
      setSavingRespuesta(false);
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return reclamos.filter((r) => {
      const matchText =
        !q ||
        r.codigo_seguimiento.toLowerCase().includes(q) ||
        `${r.nombres_reclamante} ${r.apellidos_reclamante}`.toLowerCase().includes(q) ||
        r.numero_documento.includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.establecimiento_nombre && r.establecimiento_nombre.toLowerCase().includes(q));

      if (filtroEstado !== "TODOS") {
        return matchText && r.estado === filtroEstado;
      }
      return matchText;
    });
  }, [reclamos, busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const reclamosPaginados = filtrados.slice(
    (paginaActual - 1) * ITEMS_PER_PAGE,
    paginaActual * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado]);

  const countPendientes = reclamos.filter((r) => r.estado === "PENDIENTE").length;
  const countAtendidos = reclamos.filter((r) => r.estado === "ATENDIDO").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase">
            <Scale className="w-4 h-4" />
            <span>Atención al Consumidor</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Libro de Reclamaciones
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión, auditoría y resolución legal de quejas y reclamos de clientes
          </p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Registros</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{reclamos.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">Pendientes</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{countPendientes}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Atendidos / Resueltos</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{countAtendidos}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">Conforme a Ley</p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">D.S. 011-2011-PCM</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, cliente o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["TODOS", "PENDIENTE", "EN_PROCESO", "ATENDIDO", "RECHAZADO"].map((tab) => (
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
                ? "Todos"
                : tab === "PENDIENTE"
                ? "Pendientes"
                : tab === "EN_PROCESO"
                ? "En Proceso"
                : tab === "ATENDIDO"
                ? "Atendidos"
                : "Rechazados"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Reclamaciones */}
      <div className="table-card-container">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size={32} />
            <p className="text-xs text-slate-400 mt-3 font-medium">Cargando reclamaciones...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="No se encontraron registros"
              description={
                busqueda || filtroEstado !== "TODOS"
                  ? "Prueba ajustando los filtros de búsqueda"
                  : "No hay quejas o reclamos pendientes registrados por usuarios"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Código / Fecha</th>
                  <th className="py-3.5 px-4 text-center">Tipo</th>
                  <th className="py-3.5 px-4">Consumidor Reclamante</th>
                  <th className="py-3.5 px-4">Destino / Local</th>
                  <th className="py-3.5 px-4 text-center">Monto</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reclamosPaginados.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Código & Fecha */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                        {item.codigo_seguimiento}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Tipo */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.tipo_registro === "RECLAMO"
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20"
                        }`}
                      >
                        {item.tipo_registro}
                      </span>
                    </td>

                    {/* Reclamante */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-xs">
                        {item.nombres_reclamante} {item.apellidos_reclamante}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.tipo_documento}: {item.numero_documento} · {item.email}
                      </p>
                    </td>

                    {/* Local */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {item.establecimiento_nombre || "Plataforma General"}
                      </span>
                    </td>

                    {/* Monto */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs">
                      {item.monto_reclamado > 0 ? (
                        <span className="font-bold text-slate-900 dark:text-white">
                          S/. {Number(item.monto_reclamado).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.estado === "ATENDIDO"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                            : item.estado === "EN_PROCESO"
                            ? "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20"
                            : item.estado === "RECHAZADO"
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.estado === "ATENDIDO"
                              ? "bg-emerald-500"
                              : item.estado === "EN_PROCESO"
                              ? "bg-sky-500"
                              : item.estado === "RECHAZADO"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {item.estado}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openVer(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Ver expediente completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openResponder(item)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>{item.estado === "ATENDIDO" ? "Editar Rpta" : "Atender"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Mostrando {Math.min((paginaActual - 1) * ITEMS_PER_PAGE + 1, filtrados.length)} -{" "}
                {Math.min(paginaActual * ITEMS_PER_PAGE, filtrados.length)} de{" "}
                <strong className="text-slate-900 dark:text-white">{filtrados.length}</strong> reclamaciones
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

      {/* Modal Ver Expediente */}
      <Modal
        open={modalVer}
        onClose={() => setModalVer(false)}
        title="Expediente de Reclamación"
        size="lg"
      >
        {selectedReclamo && (
          <div className="space-y-4">
            {/* Header del Expediente */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                  {selectedReclamo.codigo_seguimiento}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedReclamo.tipo_registro}: {selectedReclamo.nombres_reclamante} {selectedReclamo.apellidos_reclamante}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fecha de ingreso: {new Date(selectedReclamo.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  selectedReclamo.estado === "ATENDIDO"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                }`}
              >
                {selectedReclamo.estado}
              </span>
            </div>

            {/* Ficha del Consumidor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Identificación Reclamante</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedReclamo.tipo_documento}: {selectedReclamo.numero_documento}
                </p>
                <p className="text-slate-500 mt-0.5">{selectedReclamo.email}</p>
                <p className="text-slate-500">{selectedReclamo.telefono || "Sin teléfono"}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Local & Servicio Afectado</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedReclamo.establecimiento_nombre || "Plataforma General"}
                </p>
                <p className="text-slate-500 mt-0.5">Bien: {selectedReclamo.tipo_bien_contratado}</p>
                <p className="text-slate-500 font-mono">
                  Monto: {selectedReclamo.monto_reclamado > 0 ? `S/. ${Number(selectedReclamo.monto_reclamado).toFixed(2)}` : "No especificado"}
                </p>
              </div>

              {selectedReclamo.direccion && (
                <div className="sm:col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Dirección del Reclamante</p>
                  <p className="text-slate-700 dark:text-slate-300">{selectedReclamo.direccion}</p>
                </div>
              )}

              <div className="sm:col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hechos y Detalle del Reclamo</p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {selectedReclamo.detalle}
                </p>
              </div>

              <div className="sm:col-span-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pedido Concreto del Consumidor</p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {selectedReclamo.pedido_consumidor}
                </p>
              </div>

              {selectedReclamo.respuesta_admin && (
                <div className="sm:col-span-2 p-3.5 bg-teal-50/70 dark:bg-teal-500/10 rounded-xl border border-teal-200/70 dark:border-teal-500/20">
                  <p className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 mb-1">
                    Respuesta Formal Emitida
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedReclamo.respuesta_admin}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button onClick={() => setModalVer(false)} variant="secondary" className="text-xs">
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setModalVer(false);
                  openResponder(selectedReclamo);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                Atender / Responder
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Responder / Atender */}
      <Modal
        open={modalResponder}
        onClose={() => setModalResponder(false)}
        title="Atender Reclamación Formal"
        size="lg"
      >
        {selectedReclamo && (
          <form onSubmit={handleGuardarRespuesta} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                Reclamante: {selectedReclamo.nombres_reclamante} {selectedReclamo.apellidos_reclamante} ({selectedReclamo.tipo_documento}: {selectedReclamo.numero_documento})
              </p>
              <p className="text-slate-500 mt-0.5">
                Código: <strong className="font-mono text-teal-600">{selectedReclamo.codigo_seguimiento}</strong> · Local: {selectedReclamo.establecimiento_nombre || "Plataforma"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Estado de la Resolución *
              </label>
              <select
                value={nuevoEstado}
                onChange={(e: any) => setNuevoEstado(e.target.value)}
                className="input-base"
              >
                <option value="ATENDIDO">ATENDIDO (Reclamo resuelto formalmente)</option>
                <option value="EN_PROCESO">EN PROCESO (En investigación o peritaje)</option>
                <option value="RECHAZADO">RECHAZADO (Improcedente conforme a términos)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Respuesta Formal de la Administración *
              </label>
              <textarea
                required
                rows={5}
                value={respuestaTexto}
                onChange={(e) => setRespuestaTexto(e.target.value)}
                placeholder="Redacte la respuesta legal o de solución que se notificará al consumidor..."
                className="input-base w-full resize-y text-xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Esta respuesta quedará grabada como constancia oficial en el Libro de Reclamaciones.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalResponder(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingRespuesta}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                {savingRespuesta ? <Spinner size={16} /> : "Emitir Respuesta Formal"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
