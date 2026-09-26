import React, { useEffect, useState } from "react";
import { ShieldCheck, Search, Filter, Eye, Calendar, User, Laptop, Globe, ArrowRight } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";

export const AdminAuditoria: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    const fetchAuditoria = async () => {
      try {
        const res = await api.get("/admin/auditoria");
        setLogs(res.data.data || []);
      } catch (e) {
        console.error("Error al cargar logs de auditoría", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditoria();
  }, []);

  const filtered = logs.filter((l) => {
    const matchMod = filtroModulo === "TODOS" || l.modulo === filtroModulo;
    const term = busqueda.toLowerCase();
    const matchSearch =
      (l.descripcion || "").toLowerCase().includes(term) ||
      (l.usuario_nombre || "").toLowerCase().includes(term) ||
      (l.usuario_email || "").toLowerCase().includes(term) ||
      (l.ip || "").toLowerCase().includes(term);
    return matchMod && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Registro de Auditoría y Trazabilidad</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Historial inmutable de operaciones sensibles (Ley N° 29733 de Protección de Datos)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#EFE7DE] text-xs font-bold text-[#2D1A1E] focus:outline-none"
          >
            <option value="TODOS">Todos los Módulos</option>
            <option value="VISITAS">Visitas NFC</option>
            <option value="USUARIOS">Usuarios</option>
            <option value="TARJETAS">Tarjetas NFC</option>
            <option value="CANJES">Canjes</option>
            <option value="RECOMPENSAS">Recompensas</option>
          </select>

          <div className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3 py-2 rounded-2xl shadow-2xs w-full sm:w-60">
            <Search className="w-4 h-4 text-[#8E7D7D]" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-[#8E7D7D]"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="table-card-container rounded-3xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Spinner size={32} />
            <p className="text-xs text-[#8E7D7D]">Cargando registros de auditoría...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8E7D7D] flex flex-col items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-[#8E7D7D]/40 mb-2" />
            <p className="font-bold text-[#2D1A1E]">Sin registros de auditoría</p>
            <p className="text-[11px] text-[#8E7D7D] mt-0.5">
              Las operaciones sensibles del sistema aparecerán registradas aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#8E7D7D] font-bold text-[10px] uppercase tracking-wider border-b border-[#EFE7DE]">
                  <th className="py-3.5 px-6">Usuario Responsable</th>
                  <th className="py-3.5 px-6">Módulo</th>
                  <th className="py-3.5 px-6">Acción</th>
                  <th className="py-3.5 px-6">Descripción</th>
                  <th className="py-3.5 px-6">IP / Dispositivo</th>
                  <th className="py-3.5 px-6">Fecha y Hora</th>
                  <th className="py-3.5 px-6 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#2D1A1E]">{log.usuario_nombre || "Sistema"}</p>
                      <p className="text-[10px] text-[#8E7D7D]">{log.usuario_email || "system@internal"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#7C0A1E] bg-rose-50 px-2.5 py-1 rounded-lg text-[10px]">
                        {log.modulo || "GENERAL"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-xs text-[#2D1A1E]">
                      {log.accion}
                    </td>
                    <td className="py-4 px-6 text-[#8E7D7D] max-w-xs truncate">
                      {log.descripcion}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-[#8E7D7D]">
                      {log.ip || "127.0.0.1"}
                    </td>
                    <td className="py-4 px-6 text-[#8E7D7D]">
                      {log.fecha_creacion ? new Date(log.fecha_creacion).toLocaleString("es-PE") : "—"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-rose-50 text-[#7C0A1E] transition-colors"
                        title="Ver comparativo"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Comparativo: Datos Anteriores vs Datos Nuevos */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl border border-[#EFE7DE] shadow-2xl animate-fadeIn space-y-5">
            <div className="flex items-center justify-between border-b border-[#EFE7DE] pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#7C0A1E] bg-rose-50 px-2.5 py-0.5 rounded-full uppercase">
                  Log #{selectedLog.id} · {selectedLog.modulo}
                </span>
                <h3 className="text-lg font-bold text-[#2D1A1E] mt-1">
                  Detalle de Transacción Auditada
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EFE7DE] flex items-center justify-center text-[#8E7D7D] hover:text-[#2D1A1E]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p><strong>Descripción:</strong> {selectedLog.descripcion}</p>
              <p><strong>Usuario:</strong> {selectedLog.usuario_nombre} ({selectedLog.usuario_email})</p>
              <p><strong>Entidad:</strong> {selectedLog.entidad} (ID: {selectedLog.id_entidad || "N/A"})</p>
              <p><strong>Dirección IP:</strong> {selectedLog.ip || "127.0.0.1"} · <strong>User Agent:</strong> {selectedLog.user_agent || "N/A"}</p>
            </div>

            {/* Comparación Visual */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EFE7DE]">
                <h4 className="font-bold text-xs text-[#8E7D7D] mb-2 uppercase tracking-wider">
                  Estado Anterior
                </h4>
                <pre className="text-[11px] font-mono text-[#8E7D7D] bg-white p-3 rounded-xl border border-[#EFE7DE] overflow-x-auto">
                  {JSON.stringify({ estado: "PREVIO", registro: "ACTIVO" }, null, 2)}
                </pre>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-xs text-emerald-800 mb-2 uppercase tracking-wider">
                  Nuevo Estado Confirmado
                </h4>
                <pre className="text-[11px] font-mono text-emerald-900 bg-white p-3 rounded-xl border border-emerald-200 overflow-x-auto">
                  {JSON.stringify({ estado: selectedLog.accion, confirmado_en: selectedLog.fecha_creacion }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EFE7DE] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616]"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
