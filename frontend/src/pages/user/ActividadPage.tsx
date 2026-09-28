import React, { useEffect, useState, useRef, useCallback } from "react";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";
import { Star, ArrowUpRight, ArrowDownLeft, Bell } from "lucide-react";
import api from "../../services/api";

export const ActividadPage: React.FC = () => {
  // Orden: Visitas y Sellos primero, luego Puntos, luego Avisos
  const [tab, setTab] = useState<"visitas" | "movimientos" | "notificaciones">("visitas");
  const [data, setData] = useState<any | null>(null);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [feedRes, notifRes] = await Promise.all([
        api.get("/activity/feed"),
        api.get("/activity/notificaciones"),
      ]);
      setData(feedRes.data.data);
      setNotificaciones(notifRes.data.data || []);
    } catch (e) {
      console.error("Error al cargar actividad", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Notificaciones en tiempo real (polling cada 8s)
    pollRef.current = setInterval(() => fetchData(true), 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const marcarLeida = async (id: number) => {
    try {
      await api.patch(`/activity/notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id_notificacion === id ? { ...n, leida: 1 } : n))
      );
    } catch {
      // silent
    }
  };

  const movimientos = data?.movimientos || [];
  const visitas = data?.visitas_recientes || [];
  const unread = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] p-5 pb-8 flex flex-col">
      <div className="flex items-center justify-between mb-4 pt-2">
        <h1 className="text-xl font-bold text-[#2D1A1E]">Tu Actividad</h1>
        <div className="flex items-center space-x-1.5 bg-[#FAF8F5] border border-[#EFE7DE] px-3 py-1.5 rounded-full text-xs font-bold text-[#7C0A1E]">
          <Star size={14} fill="#C5A059" className="text-[#C5A059]" />
          <span>{data?.resumen?.puntos_actuales ?? 0} pts</span>
        </div>
      </div>

      {/* Tabs: Visitas y Sellos primero, Puntos segundo */}
      <div className="bg-white p-1 rounded-2xl border border-[#EFE7DE] flex mb-4 shadow-sm">
        <button
          onClick={() => setTab("visitas")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "visitas" ? "bg-[#7C0A1E] text-white shadow-sm" : "text-[#8E7D7D]"
          }`}
        >
          Visitas y Sellos
        </button>
        <button
          onClick={() => setTab("movimientos")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "movimientos" ? "bg-[#7C0A1E] text-white shadow-sm" : "text-[#8E7D7D]"
          }`}
        >
          Puntos
        </button>
        <button
          onClick={() => setTab("notificaciones")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
            tab === "notificaciones" ? "bg-[#7C0A1E] text-white shadow-sm" : "text-[#8E7D7D]"
          }`}
        >
          Avisos {unread > 0 && `(${unread})`}
          {unread > 0 && tab !== "notificaciones" && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-[#C5A059] rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {tab === "visitas" && (
        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#8E7D7D]">Cargando...</div>
          ) : visitas.length > 0 ? (
            visitas.map((v: any) => (
              <div
                key={v.id_visita}
                className="bg-white p-3.5 rounded-2xl border border-[#EFE7DE] shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <DigitalStampBadge
                      establecimiento_nombre={v.establecimiento_nombre}
                      imagen_sello={v.imagen_sello || "☕"}
                      color_sello={v.color_sello || "#7C0A1E"}
                      numero_sello={v.numero_sello || 1}
                      fecha={v.fecha_hora}
                      size="sm"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1A1E]">{v.establecimiento_nombre}</h4>
                    <p className="text-[10px] text-[#8E7D7D]">{v.sucursal_nombre}</p>
                    <p className="text-[9px] text-[#C5A059] font-medium mt-0.5">
                      {new Date(v.fecha_hora).toLocaleDateString()} • Sello #{v.numero_sello || 1}
                    </p>
                  </div>
                </div>
                <div className="bg-[#FAF8F5] border border-[#EFE7DE] text-[#7C0A1E] text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                  Confirmada
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#EFE7DE] p-4 text-xs text-[#8E7D7D]">
              Aún no tienes visitas registradas.
            </div>
          )}
        </div>
      )}

      {tab === "movimientos" && (
        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#8E7D7D]">Cargando...</div>
          ) : movimientos.length > 0 ? (
            movimientos.map((m: any) => {
              const esPositivo = m.cantidad > 0;
              return (
                <div
                  key={m.id_movimiento}
                  className="bg-white p-3.5 rounded-2xl border border-[#EFE7DE] shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        esPositivo ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {esPositivo ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#2D1A1E]">
                        {m.descripcion || m.tipo_movimiento}
                      </h4>
                      <p className="text-[10px] text-[#8E7D7D]">
                        {new Date(m.fecha_movimiento).toLocaleDateString()} • Saldo: {m.saldo_posterior} pts
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-extrabold ${
                      esPositivo ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {esPositivo ? `+${m.cantidad}` : m.cantidad}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#EFE7DE] p-4 text-xs text-[#8E7D7D]">
              No hay movimientos de puntos registrados aún.
            </div>
          )}
        </div>
      )}

      {tab === "notificaciones" && (
        <div className="space-y-2.5">
          {notificaciones.length > 0 ? (
            notificaciones.map((n: any) => (
              <div
                key={n.id_notificacion}
                onClick={() => !n.leida && marcarLeida(n.id_notificacion)}
                className={`p-3.5 rounded-2xl border shadow-sm flex items-start space-x-3 cursor-pointer transition-colors ${
                  n.leida ? "bg-white border-[#EFE7DE]" : "bg-[#FFF9F5] border-[#C5A059]/40"
                }`}
              >
                <Bell size={18} className="text-[#7C0A1E] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#2D1A1E]">{n.titulo}</h4>
                    <span className="text-[9px] text-[#8E7D7D]">
                      {new Date(n.fecha_creacion).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E7D7D] mt-0.5">{n.mensaje}</p>
                  {!n.leida && (
                    <span className="inline-block mt-1 text-[9px] font-bold text-[#C5A059]">Nueva</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#EFE7DE] p-4 text-xs text-[#8E7D7D]">
              No tienes notificaciones pendientes.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
