import React, { useEffect, useState } from "react";
import { Gift, Award, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import api from "../../services/api";
import { Spinner } from "../../components/common/Spinner";
import { useUI } from "../../hooks/useUI";

export const CommerceRecompensas: React.FC = () => {
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useUI();

  useEffect(() => {
    const fetchRecompensas = async () => {
      try {
        const res = await api.get("/establishments/me/recompensas");
        setRecompensas(res.data.data || []);
      } catch (e) {
        console.error("Error al cargar recompensas del local", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecompensas();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Recompensas del Establecimiento</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Premios asignados a tu comercio y control de stock disponible en mostrador
          </p>
        </div>

        <div className="bg-[#FAF8F5] border border-[#EFE7DE] px-3.5 py-2 rounded-2xl text-xs text-[#8E7D7D] font-medium flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#C5A059]" />
          <span>La creación global es gestionada por Administración Central</span>
        </div>
      </div>

      {/* Grid de Recompensas */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Spinner size={32} />
          <p className="text-xs text-[#8E7D7D]">Cargando catálogo de premios...</p>
        </div>
      ) : recompensas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#EFE7DE] text-center shadow-xs">
          <Gift className="w-12 h-12 text-[#C5A059] mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#2D1A1E]">Sin recompensas configuradas</h3>
          <p className="text-xs text-[#8E7D7D] mt-1">
            Tu establecimiento aún no cuenta con premios registrados en su catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recompensas.map((r) => (
            <div
              key={r.id_recompensa}
              className="bg-white rounded-3xl border border-[#EFE7DE] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-[#7C0A1E]/30 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] flex items-center justify-center font-bold text-xl shadow-inner">
                    🎁
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase">
                    {r.estado || "ACTIVA"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#2D1A1E]">{r.nombre}</h3>
                  <p className="text-xs text-[#8E7D7D] mt-1 line-clamp-2">{r.descripcion || "Beneficio exclusivo para clientes fieles."}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE7DE] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E7D7D] font-medium">Puntos Requeridos</span>
                  <span className="font-black text-[#7C0A1E] flex items-center gap-1">
                    <Sparkles size={13} className="text-[#C5A059]" />
                    {r.puntos_requeridos} pts
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E7D7D] font-medium">Stock en Local</span>
                  <span className="font-bold text-[#2D1A1E]">
                    {r.stock_ilimitado ? "Ilimitado" : `${r.stock ?? 0} unidades`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E7D7D] font-medium">Canjes Realizados</span>
                  <span className="font-bold text-emerald-600">
                    {r.total_canjeados ?? 0} entregados
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
