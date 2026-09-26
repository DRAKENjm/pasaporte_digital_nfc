import React, { useEffect, useState, useMemo } from "react";
import { Search, Calendar, History, Award, CheckCircle2, Clock, Filter } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";

export const CommerceHistorial: React.FC = () => {
  const [visitas, setVisitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTiempo, setFiltroTiempo] = useState<"HOY" | "SEMANA" | "MES" | "TODOS">("TODOS");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchVisitas = async () => {
      try {
        const res = await api.get("/establishments/me/visitas");
        setVisitas(res.data.data || []);
      } catch (e) {
        console.error("Error al cargar historial de visitas", e);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitas();
  }, []);

  const filtered = useMemo(() => {
    return visitas.filter((v) => {
      // Filtro de texto
      const term = busqueda.toLowerCase();
      const matchText = (v.cliente_nombre || "").toLowerCase().includes(term) || (v.sucursal_nombre || "").toLowerCase().includes(term);

      // Filtro de estado
      const matchEstado = filtroEstado === "TODOS" || v.estado === filtroEstado;

      // Filtro de tiempo
      let matchTiempo = true;
      if (filtroTiempo !== "TODOS" && v.fecha_hora) {
        const vDate = new Date(v.fecha_hora);
        const now = new Date();
        if (filtroTiempo === "HOY") {
          matchTiempo = vDate.toDateString() === now.toDateString();
        } else if (filtroTiempo === "SEMANA") {
          const diffDays = (now.getTime() - vDate.getTime()) / (1000 * 3600 * 24);
          matchTiempo = diffDays <= 7;
        } else if (filtroTiempo === "MES") {
          matchTiempo = vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
        }
      }

      return matchText && matchEstado && matchTiempo;
    });
  }, [visitas, busqueda, filtroEstado, filtroTiempo]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Historial de Validaciones</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Registro cronológico de visitas, compras y sellos otorgados en tu sucursal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros de Tiempo */}
          <div className="bg-white border border-[#EFE7DE] p-1 rounded-2xl flex shadow-2xs">
            {(["TODOS", "HOY", "SEMANA", "MES"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTiempo(t)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  filtroTiempo === t
                    ? "bg-[#7C0A1E] text-white shadow-2xs"
                    : "text-[#8E7D7D] hover:text-[#2D1A1E]"
                }`}
              >
                {t === "TODOS" ? "Todo" : t === "HOY" ? "Hoy" : t === "SEMANA" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-[#8E7D7D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-base input-with-search w-full text-xs"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-card-container rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Spinner size={32} />
            <p className="text-xs text-[#8E7D7D]">Cargando historial...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8E7D7D] flex flex-col items-center justify-center">
            <History className="w-10 h-10 text-[#8E7D7D]/40 mb-2" />
            <p className="font-bold text-[#2D1A1E]">Sin registros de visitas</p>
            <p className="text-[11px] text-[#8E7D7D] mt-0.5">
              Las validaciones confirmadas desde la Terminal NFC aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5]/80 text-[#8E7D7D] font-bold text-[10px] uppercase tracking-wider border-b border-[#EFE7DE]/70">
                  <th className="py-3.5 px-6">Cliente</th>
                  <th className="py-3.5 px-6">Fecha y Hora</th>
                  <th className="py-3.5 px-6">Sucursal</th>
                  <th className="py-3.5 px-6">Compra / Detalle</th>
                  <th className="py-3.5 px-6">Sello</th>
                  <th className="py-3.5 px-6">Puntos</th>
                  <th className="py-3.5 px-6">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]/60">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#2D1A1E]">
                      {v.cliente_nombre || "Cliente"}
                    </td>
                    <td className="py-4 px-6 text-[#8E7D7D]">
                      {v.fecha_hora ? new Date(v.fecha_hora).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "—"}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#2D1A1E]">
                      {v.sucursal_nombre || "Principal"}
                    </td>
                    <td className="py-4 px-6 text-[#8E7D7D]">
                      {v.observacion || "Consumo presencial"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-xs font-bold text-[#7C0A1E] bg-rose-50 px-2 py-0.5 rounded-md">
                        +1
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-xs font-black text-[#C5A059]">
                        +{v.puntos_ganados || 20} pts
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ {v.estado || "CONFIRMADA"}
                      </span>
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
