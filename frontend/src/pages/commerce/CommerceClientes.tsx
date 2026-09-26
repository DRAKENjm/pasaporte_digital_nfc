import React, { useEffect, useState } from "react";
import { Search, Users, Calendar, Award, Sparkles, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";

export const CommerceClientes: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get("/establishments/me/clientes");
        setClientes(res.data.data || []);
      } catch (e) {
        console.error("Error al cargar clientes del local", e);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const filtered = clientes.filter((c) => {
    const term = search.toLowerCase();
    const fullName = `${c.nombres || ""} ${c.apellidos || ""}`.toLowerCase();
    const code = (c.codigo_cliente || "").toLowerCase();
    return fullName.includes(term) || code.includes(term) || (c.email || "").toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Clientes del Establecimiento</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Registro exclusivo de clientes que han visitado tu local (Aislamiento de Dominio Activo)
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8E7D7D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base input-with-search w-full text-xs"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="table-card-container rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Spinner size={32} />
            <p className="text-xs text-[#8E7D7D]">Cargando clientes fidelizados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8E7D7D] flex flex-col items-center justify-center">
            <Users className="w-10 h-10 text-[#8E7D7D]/40 mb-2" />
            <p className="font-bold text-[#2D1A1E]">No se encontraron clientes</p>
            <p className="text-[11px] text-[#8E7D7D] mt-0.5">
              Los clientes que validen su tarjeta NFC en este establecimiento aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5]/80 text-[#8E7D7D] font-bold text-[10px] uppercase tracking-wider border-b border-[#EFE7DE]/70">
                  <th className="py-3.5 px-6">Cliente</th>
                  <th className="py-3.5 px-6">Código</th>
                  <th className="py-3.5 px-6">Visitas en Local</th>
                  <th className="py-3.5 px-6">Sellos</th>
                  <th className="py-3.5 px-6">Puntos Generados</th>
                  <th className="py-3.5 px-6">Última Visita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]/60">
                {filtered.map((cl) => (
                  <tr key={cl.id_cliente} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-black text-xs flex items-center justify-center shrink-0">
                          {cl.nombres?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-[#2D1A1E]">{cl.nombres} {cl.apellidos || ""}</p>
                          <p className="text-[10px] text-[#8E7D7D]">{cl.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-[#7C0A1E]">
                      {cl.codigo_cliente || "CLI-100234"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-bold text-[#2D1A1E] bg-slate-100 px-2.5 py-1 rounded-lg">
                        {cl.total_visitas} visitas
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-bold text-[#7C0A1E] bg-rose-50 px-2.5 py-1 rounded-lg">
                        <Award size={13} />
                        {cl.total_sellos} sellos
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-black text-[#C5A059]">
                        <Sparkles size={13} />
                        +{cl.puntos_en_local} pts
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#8E7D7D]">
                      {cl.ultima_visita ? new Date(cl.ultima_visita).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
