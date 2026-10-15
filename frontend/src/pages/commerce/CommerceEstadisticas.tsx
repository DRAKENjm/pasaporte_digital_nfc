import React, { useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";

export const CommerceEstadisticas: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/establishments/me/stats");
        setStats(res.data?.data ?? res.data);
      } catch (e) {
        console.error("Error al cargar estadísticas", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2">
        <Spinner size={32} />
        <p className="text-xs text-[#8E7D7D]">Cargando estadísticas del local...</p>
      </div>
    );
  }

  if (error || !stats) {
    return <div className="py-16 text-center text-sm text-[#8E7D7D]">No se pudieron cargar las estadísticas del local. Intenta nuevamente más tarde.</div>;
  }

  const clientesUnicos = stats?.clientes_unicos ?? 0;
  const visitasTotales = stats?.visitas_mes ?? 0;
  const puntosTotales = stats?.puntos_mes ?? 0;

  // Días de la semana iniciando siempre el Lunes (Lun)
  const diasSemanaOrden = [
    { num: 1, nombre: "Lunes", corto: "Lun" },
    { num: 2, nombre: "Martes", corto: "Mar" },
    { num: 3, nombre: "Miércoles", corto: "Mié" },
    { num: 4, nombre: "Jueves", corto: "Jue" },
    { num: 5, nombre: "Viernes", corto: "Vie" },
    { num: 6, nombre: "Sábado", corto: "Sáb" },
    { num: 7, nombre: "Domingo", corto: "Dom" },
  ];
  const visitasPorDia = (stats?.visitas_por_dia ?? []) as Array<{ dia_semana: number; total: number }>;
  const diasConVisitas = diasSemanaOrden.map((dia) => {
    const match = visitasPorDia.find(
      (d) => Number(d.dia_semana) === dia.num || (dia.num === 7 && Number(d.dia_semana) === 0)
    );
    return {
      ...dia,
      total: Number(match?.total) || 0,
    };
  });
  const maxVisitasDia = Math.max(1, ...diasConVisitas.map((dia) => dia.total));

  const franjas = [
    { id: "manana", nombre: "08:00 AM - 11:00 AM (Mañana)" },
    { id: "mediodia", nombre: "11:00 AM - 03:00 PM (Mediodía)" },
    { id: "tarde", nombre: "03:00 PM - 07:00 PM (Tarde)" },
    { id: "noche", nombre: "07:00 PM - 10:00 PM (Noche)" },
    { id: "otros", nombre: "Otros horarios" },
  ];
  const visitasPorHora = (stats?.visitas_por_hora ?? []) as Array<{ franja: string; total: number }>;
  const maxVisitasHora = Math.max(1, ...visitasPorHora.map((franja) => Number(franja.total) || 0));

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Estadísticas y Analítica del Local</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Comportamiento de clientes, tasa de fidelización y afluencia exclusiva en tu establecimiento
        </p>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Clientes Únicos</span>
          <h3 className="text-2xl font-black text-[#2D1A1E] mt-1">{clientesUnicos}</h3>
          <span className="text-[10px] font-bold text-emerald-600">Comunidad local</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Total Visitas</span>
          <h3 className="text-2xl font-black text-[#7C0A1E] mt-1">{visitasTotales}</h3>
          <span className="text-[10px] font-bold text-rose-700">Validaciones confirmadas</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Puntos Emitidos este Mes</span>
          <h3 className="text-2xl font-black text-[#C5A059] mt-1">{puntosTotales} pts</h3>
          <span className="text-[10px] text-[#8E7D7D]">Según los puntos configurados por visita</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#EFE7DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E7D7D]">Frecuencia de Visita este Mes</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {clientesUnicos > 0 ? `${Math.round((visitasTotales / clientesUnicos) * 10) / 10}x` : "0x"}
          </h3>
          <span className="text-[10px] font-bold text-emerald-600">Visitas promedio por cliente</span>
        </div>
      </div>

      {/* Bloque Gráficos: Días con más visitas & Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Días con más afluencia */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE7DE] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7C0A1E]" />
              <h3 className="text-sm font-bold text-[#2D1A1E]">Días con Mayor Afluencia</h3>
            </div>
            <span className="text-[10px] font-bold text-[#8E7D7D] bg-[#FAF8F5] px-2 py-1 rounded-lg">
              Histórico
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {diasConVisitas.map((d) => {
              const pct = maxVisitasDia > 0 ? (d.total / maxVisitasDia) * 100 : 0;
              return (
                <div key={d.num} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2D1A1E]">{d.nombre}</span>
                    <span className="font-black text-[#7C0A1E]">{d.total} visitas</span>
                  </div>
                  <div className="w-full bg-[#FAF8F5] h-3 rounded-full border border-[#EFE7DE] overflow-hidden p-0.5">
                    <div
                      style={{ width: `${d.total > 0 ? Math.max(6, pct) : 0}%` }}
                      className="bg-gradient-to-r from-[#8E283B] to-[#7C0A1E] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horarios Pico */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE7DE] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              <h3 className="text-sm font-bold text-[#2D1A1E]">Horarios Pico de Visitas</h3>
            </div>
            <span className="text-[10px] font-bold text-[#8E7D7D] bg-[#FAF8F5] px-2 py-1 rounded-lg">
              Franja Horaria
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {franjas.map((f) => {
              const visitas = Number(visitasPorHora.find((v) => v.franja === f.id)?.total) || 0;
              const pct = maxVisitasHora > 0 ? (visitas / maxVisitasHora) * 100 : 0;
              return (
                <div key={f.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2D1A1E] truncate max-w-[240px]">{f.nombre}</span>
                    <span className="font-black text-[#C5A059]">{visitas} visitas</span>
                  </div>
                  <div className="w-full bg-[#FAF8F5] h-3 rounded-full border border-[#EFE7DE] overflow-hidden p-0.5">
                    <div
                      style={{ width: `${visitas > 0 ? Math.max(6, pct) : 0}%` }}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#C5A059] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
