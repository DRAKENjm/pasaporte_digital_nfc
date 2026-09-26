import React, { useEffect, useState } from "react";
import { 
  TicketCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Sparkles, 
  UserCheck,
  RotateCw,
  Gift,
  ArrowRight
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";

export const CommerceCanjes: React.FC = () => {
  const [canjes, setCanjes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"PENDIENTE" | "ENTREGADO" | "CANCELADO" | "TODOS">("PENDIENTE");
  
  // Flujo rápido de validación por código en mostrador
  const [codigoInput, setCodigoInput] = useState("");
  const [canjeValidado, setCanjeValidado] = useState<any | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { showToast } = useUI();

  const fetchCanjes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/establishments/me/canjes");
      setCanjes(res.data.data || []);
    } catch (e) {
      console.error("Error al cargar canjes", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanjes();
  }, []);

  // Validar código ingresado por el cliente
  const handleValidarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim()) {
      showToast("Ingresa el código de canje del cliente", "error");
      return;
    }

    const c = canjes.find((item) => item.codigo_canje.toUpperCase() === codigoInput.trim().toUpperCase());
    if (!c) {
      showToast("Código de canje no encontrado en este establecimiento", "error");
      setCanjeValidado(null);
      return;
    }

    setCanjeValidado(c);
    showToast("Código verificado. Procede a confirmar la entrega.", "success");
  };

  // Confirmar Entrega
  const handleConfirmarEntrega = async (idCanje: number, codigo: string) => {
    setConfirming(true);
    try {
      await api.post("/rewards/confirmar-entrega", {
        codigo_canje: codigo
      });
      showToast("¡Entrega de recompensa confirmada exitosamente!", "success");
      setCanjeValidado(null);
      setCodigoInput("");
      await fetchCanjes();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al confirmar entrega", "error");
    } finally {
      setConfirming(false);
    }
  };

  const filtered = canjes.filter((c) => {
    if (tab === "TODOS") return true;
    if (tab === "ENTREGADO") return c.estado === "ENTREGADO" || c.estado === "CONFIRMADO";
    return c.estado === tab;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Gestión y Entrega de Canjes</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Validación de códigos de recompensa presentados por clientes en el mostrador
        </p>
      </div>

      {/* Bloque Destacado: Validador de Código en Mostrador */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
          <TicketCheck className="w-5 h-5 text-[#7C0A1E]" />
          <h2 className="text-sm font-bold text-[#2D1A1E]">Validación Rápida de Cupón / Código</h2>
        </div>

        <form onSubmit={handleValidarCodigo} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Ingresa código (ej. CNJ-100234-5678)"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl border border-[#EFE7DE] text-sm font-mono font-bold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Search size={16} />
            <span>VERIFICAR CÓDIGO</span>
          </button>
        </form>

        {/* Modal de Validación de Código */}
        {canjeValidado && (
          <div className="mt-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-[#7C0A1E]/30 text-[#7C0A1E] flex items-center justify-center font-bold text-xl shadow-inner">
                🎁
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7C0A1E] bg-rose-50 px-2 py-0.5 rounded-md uppercase">
                  {canjeValidado.estado}
                </span>
                <h3 className="text-base font-bold text-[#2D1A1E] mt-0.5">
                  {canjeValidado.recompensa_nombre}
                </h3>
                <p className="text-xs text-[#8E7D7D]">
                  Cliente: <strong>{canjeValidado.cliente_nombre}</strong> · Código: <span className="font-mono font-bold">{canjeValidado.codigo_canje}</span>
                </p>
              </div>
            </div>

            {canjeValidado.estado === "PENDIENTE" ? (
              <button
                type="button"
                onClick={() => handleConfirmarEntrega(canjeValidado.id, canjeValidado.codigo_canje)}
                disabled={confirming}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {confirming ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>[ CONFIRMAR ENTREGA ]</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                ✓ Beneficio ya entregado
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs de Canjes */}
      <div className="flex items-center justify-between">
        <div className="bg-white border border-[#EFE7DE] p-1 rounded-2xl flex shadow-2xs">
          {(["PENDIENTE", "ENTREGADO", "CANCELADO", "TODOS"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t
                  ? "bg-[#7C0A1E] text-white shadow-2xs"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E]"
              }`}
            >
              {t === "PENDIENTE" ? "Pendientes" : t === "ENTREGADO" ? "Canjeados / Entregados" : t === "CANCELADO" ? "Cancelados" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Canjes */}
      <div className="table-card-container rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Spinner size={32} />
            <p className="text-xs text-[#8E7D7D]">Cargando solicitudes de canje...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8E7D7D] flex flex-col items-center justify-center">
            <TicketCheck className="w-10 h-10 text-[#8E7D7D]/40 mb-2" />
            <p className="font-bold text-[#2D1A1E]">No hay canjes en esta sección</p>
            <p className="text-[11px] text-[#8E7D7D] mt-0.5">
              Las solicitudes de canje realizadas por los clientes aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5]/80 text-[#8E7D7D] font-bold text-[10px] uppercase tracking-wider border-b border-[#EFE7DE]/70">
                  <th className="py-3.5 px-6">Código</th>
                  <th className="py-3.5 px-6">Cliente</th>
                  <th className="py-3.5 px-6">Recompensa</th>
                  <th className="py-3.5 px-6">Puntos Canjeados</th>
                  <th className="py-3.5 px-6">Fecha de Solicitud</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#7C0A1E]">
                      {c.codigo_canje}
                    </td>
                    <td className="py-4 px-6 font-bold text-[#2D1A1E]">
                      {c.cliente_nombre}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#2D1A1E]">
                      {c.recompensa_nombre}
                    </td>
                    <td className="py-4 px-6 font-black text-[#C5A059]">
                      -{c.puntos_gastados} pts
                    </td>
                    <td className="py-4 px-6 text-[#8E7D7D]">
                      {c.fecha_solicitud ? new Date(c.fecha_solicitud).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "—"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.estado === "PENDIENTE"
                          ? "bg-amber-100 text-amber-800"
                          : c.estado === "ENTREGADO" || c.estado === "CONFIRMADO"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {c.estado === "PENDIENTE" && (
                        <button
                          type="button"
                          onClick={() => handleConfirmarEntrega(c.id, c.codigo_canje)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition shadow-2xs"
                        >
                          Entregar
                        </button>
                      )}
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
