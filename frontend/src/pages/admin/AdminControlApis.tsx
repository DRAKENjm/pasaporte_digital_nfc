import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
  Server,
  ShieldAlert,
  Sliders,
  Database,
  MapPin,
  Flame,
  Check,
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";

interface ApiService {
  id: number;
  servicio: string;
  nombre_visible: string;
  estado: "OPERATIVO" | "DEGRADADO" | "CONTINGENCIA";
  modo_contingencia: boolean;
  cuota_mensual_limite: number;
  consumo_actual: number;
  umbral_preventivo_porcentaje: number;
  umbral_prioritario_porcentaje: number;
  porcentaje_consumo: number;
  alerta_70_disparada: boolean;
  alerta_90_disparada: boolean;
  ultima_sincronizacion: string;
  notas?: string;
}

interface ApiIncident {
  id: number;
  servicio: string;
  tipo_evento: string;
  descripcion: string;
  detalles_tecnicos?: any;
  resuelto: boolean;
  fecha_registro: string;
  fecha_resolucion?: string;
}

export const AdminControlApis: React.FC = () => {
  const { showToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [servicios, setServicios] = useState<ApiService[]>([]);
  const [incidentes, setIncidentes] = useState<ApiIncident[]>([]);
  const [estadoGeneral, setEstadoGeneral] = useState<"OPERATIVO" | "ATENCION" | "CONTINGENCIA">("OPERATIVO");
  const [alertasActivas, setAlertasActivas] = useState<Array<{ nivel: string; servicio: string; mensaje: string }>>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>("");

  // Estado de edición de configuración
  const [editandoServicio, setEditandoServicio] = useState<string | null>(null);
  const [cuotaInput, setCuotaInput] = useState<number>(28000);
  const [consumoInput, setConsumoInput] = useState<number>(21840);
  const [umbral70Input, setUmbral70Input] = useState<number>(70);
  const [umbral90Input, setUmbral90Input] = useState<number>(90);
  const [guardando, setGuardando] = useState(false);

  const fetchOverview = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get("/admin/control-apis");
      const data = res.data?.data || res.data;

      if (data) {
        setServicios(data.servicios || []);
        setIncidentes(data.incidentes || []);
        setEstadoGeneral(data.estado_general || "OPERATIVO");
        setAlertasActivas(data.alertas_activas || []);
        setUltimaActualizacion(data.ultima_actualizacion || new Date().toISOString());
      }
    } catch {
      showToast("Error al cargar métricas de Control de APIs", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(() => fetchOverview(true), 45000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleContingencia = async (servicio: string, actual: boolean) => {
    try {
      const nuevoEstado = !actual;
      await api.post("/admin/control-apis/config", {
        servicio,
        modo_contingencia: nuevoEstado,
      });

      showToast(
        nuevoEstado
          ? "Modo de contingencia ACTIVADO: Los clientes verán la alternativa para abrir en Google Maps"
          : "Modo de contingencia DESACTIVADO: Navegación de RutaYa restablecida",
        nuevoEstado ? "info" : "success"
      );

      fetchOverview(true);
    } catch {
      showToast("Error al cambiar modo de contingencia", "error");
    }
  };

  const abrirEdicion = (srv: ApiService) => {
    setEditandoServicio(srv.servicio);
    setCuotaInput(srv.cuota_mensual_limite);
    setConsumoInput(srv.consumo_actual);
    setUmbral70Input(srv.umbral_preventivo_porcentaje || 70);
    setUmbral90Input(srv.umbral_prioritario_porcentaje || 90);
  };

  const guardarConfiguracion = async () => {
    if (!editandoServicio) return;
    try {
      setGuardando(true);
      await api.post("/admin/control-apis/config", {
        servicio: editandoServicio,
        cuota_mensual_limite: Number(cuotaInput),
        consumo_actual: Number(consumoInput),
        umbral_preventivo_porcentaje: Number(umbral70Input),
        umbral_prioritario_porcentaje: Number(umbral90Input),
      });

      showToast("Umbrales y cuota actualizados correctamente", "success");
      setEditandoServicio(null);
      fetchOverview(true);
    } catch {
      showToast("Error al guardar configuración", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleResolverIncidente = async (id: number) => {
    try {
      await api.patch(`/admin/control-apis/incidentes/${id}/resolver`);
      showToast("Incidente marcado como resuelto", "success");
      fetchOverview(true);
    } catch {
      showToast("Error al resolver incidente", "error");
    }
  };

  const formatFechaHora = (isoStr: string) => {
    if (!isoStr) return "Desconocida";
    const d = new Date(isoStr);
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const mapsService = servicios.find((s) => s.servicio === "GOOGLE_MAPS") || servicios[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7C0A1E] mb-1">
            <Activity size={15} />
            <span>Panel administrativo de RutaYa</span>
          </div>
          <h1 className="text-2xl font-black text-[#2D1A1E]">Control de APIs y Monitorización</h1>
          <p className="text-sm text-[#8E7D7D] mt-1">
            Control de cuotas de servicios gratuitos (Google Maps, Render, Supabase) y modo de contingencia para clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-[#8E7D7D]">Última sincronización</p>
            <p className="text-xs font-bold text-[#2D1A1E] flex items-center justify-end gap-1">
              <Clock size={12} className="text-[#7C0A1E]" />
              {formatFechaHora(ultimaActualizacion)}
            </p>
          </div>

          <button
            onClick={() => fetchOverview(true)}
            disabled={refreshing || loading}
            className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#2D1A1E] hover:text-[#7C0A1E] hover:bg-[#EFE7DE] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refrescar métricas"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin text-[#7C0A1E]" : ""} />
          </button>
        </div>
      </div>

      {/* BANNER DE ESTADO GENERAL Y ALERTAS */}
      {alertasActivas.length > 0 && (
        <div className="space-y-2">
          {alertasActivas.map((alerta, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start sm:items-center justify-between gap-3 shadow-xs ${
                alerta.nivel === "CRITICO"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : alerta.nivel === "PRIORITARIO"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alerta.nivel === "CRITICO"
                      ? "bg-red-100 text-red-700"
                      : alerta.nivel === "PRIORITARIO"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {alerta.nivel === "CRITICO" ? (
                    <ShieldAlert size={20} />
                  ) : alerta.nivel === "PRIORITARIO" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">{alerta.servicio}</h4>
                  <p className="text-xs font-medium mt-0.5">{alerta.mensaje}</p>
                </div>
              </div>

              {alerta.nivel === "PRIORITARIO" && (
                <a
                  href="https://console.cloud.google.com/google/maps-apis/overview"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  <span>Revisar Google Cloud</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TARJETA DESTACADA: GOOGLE MAPS PLATFORM (RUTAS & NAVEGACIÓN) */}
      {mapsService && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#EFE7DE]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#004D40] text-white flex items-center justify-center shadow-md shrink-0">
                <MapPin size={28} className="text-[#A7F3D0]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#2D1A1E]">{mapsService.nombre_visible}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      mapsService.modo_contingencia
                        ? "bg-red-100 text-red-800"
                        : mapsService.porcentaje_consumo >= 90
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {mapsService.modo_contingencia
                      ? "Modo Contingencia"
                      : mapsService.porcentaje_consumo >= 90
                      ? "Alerta Prioritaria"
                      : "Operativo"}
                  </span>
                </div>
                <p className="text-xs text-[#8E7D7D] mt-1">
                  Directions API, Maps JavaScript SDK y Geolocation en el cliente. Crédito gratuito inicial de $200 USD/mes.
                </p>
              </div>
            </div>

            {/* Toggle de Modo Contingencia Manual */}
            <div className="flex items-center gap-3 bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#EFE7DE]">
              <div className="text-right">
                <p className="text-xs font-bold text-[#2D1A1E]">Contingencia hacia Google Maps</p>
                <p className="text-[11px] text-[#8E7D7D]">
                  {mapsService.modo_contingencia ? "Activado (Clientes ven aviso profesional)" : "Desactivado (Navegación propia)"}
                </p>
              </div>
              <button
                onClick={() => handleToggleContingencia(mapsService.servicio, mapsService.modo_contingencia)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  mapsService.modo_contingencia ? "bg-red-600" : "bg-slate-300"
                }`}
                title="Conmutar modo de contingencia manual"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    mapsService.modo_contingencia ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* GAUGES Y MÉTRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* 1. Consumo mensual verificado */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EFE7DE] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E7D7D]">Consumo mensual verificado</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-[#2D1A1E]">{mapsService.porcentaje_consumo}%</span>
                  <span className="text-xs font-bold text-[#7C0A1E]">de la cuota configurada</span>
                </div>
              </div>

              {/* Barra de progreso con marcas en 70% y 90% */}
              <div className="mt-4">
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      mapsService.porcentaje_consumo >= 90
                        ? "bg-red-600"
                        : mapsService.porcentaje_consumo >= 70
                        ? "bg-amber-500"
                        : "bg-[#004D40]"
                    }`}
                    style={{ width: `${mapsService.porcentaje_consumo}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8E7D7D] font-bold mt-1">
                  <span>0%</span>
                  <span className="text-amber-700">70% Preventivo</span>
                  <span className="text-red-700">90% Prioritario</span>
                  <span>100% Límite</span>
                </div>
              </div>
            </div>

            {/* 2. Solicitudes vs Cuota */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EFE7DE] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E7D7D]">Cargas y Peticiones</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-[#2D1A1E]">
                    {mapsService.consumo_actual.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#8E7D7D]">/ {mapsService.cuota_mensual_limite.toLocaleString()} límite</span>
                </div>
              </div>
              <p className="text-[11px] text-[#8E7D7D] mt-3">
                Restante estimado:{" "}
                <span className="font-bold text-[#2D1A1E]">
                  {Math.max(0, mapsService.cuota_mensual_limite - mapsService.consumo_actual).toLocaleString()} peticiones
                </span>
              </p>
            </div>

            {/* 3. Estado de navegación para clientes */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EFE7DE] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E7D7D]">Estado de navegación</span>
                <div className="flex items-center gap-2 mt-2">
                  {mapsService.modo_contingencia ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-lg font-bold text-red-700">En Contingencia (Google Maps externo)</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-lg font-bold text-emerald-700">Disponible (Navegación RutaYa)</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#EFE7DE]">
                <span className="text-[11px] text-[#8E7D7D]">Configurar umbrales</span>
                <button
                  onClick={() => abrirEdicion(mapsService)}
                  className="text-xs font-bold text-[#7C0A1E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sliders size={13} />
                  <span>Ajustar límites</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / FORMULARIO DE AJUSTE DE CUOTAS Y UMBRALES */}
      {editandoServicio && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#EFE7DE] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DE]">
              <div className="flex items-center gap-2 text-[#7C0A1E]">
                <Sliders size={18} />
                <h3 className="font-bold text-base text-[#2D1A1E]">Ajustar Cuota y Umbrales de {editandoServicio}</h3>
              </div>
              <button
                onClick={() => setEditandoServicio(null)}
                className="text-[#8E7D7D] hover:text-[#2D1A1E] text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2D1A1E] mb-1">Cuota mensual máxima configurada (Peticiones)</label>
                <input
                  type="number"
                  value={cuotaInput}
                  onChange={(e) => setCuotaInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DE] bg-[#FAF8F5] font-bold text-sm text-[#2D1A1E]"
                />
                <p className="text-[11px] text-[#8E7D7D] mt-0.5">Para Google Maps, 28,000 peticiones representan los $200 de crédito mensual.</p>
              </div>

              <div>
                <label className="block font-bold text-[#2D1A1E] mb-1">Consumo actual registrado (Peticiones)</label>
                <input
                  type="number"
                  value={consumoInput}
                  onChange={(e) => setConsumoInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#EFE7DE] bg-[#FAF8F5] font-bold text-sm text-[#2D1A1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-800 mb-1">Aviso preventivo (%)</label>
                  <input
                    type="number"
                    value={umbral70Input}
                    onChange={(e) => setUmbral70Input(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50 font-bold text-sm text-amber-900"
                  />
                  <p className="text-[10px] text-[#8E7D7D] mt-0.5">Propuesto: 70%</p>
                </div>
                <div>
                  <label className="block font-bold text-red-800 mb-1">Alerta prioritaria (%)</label>
                  <input
                    type="number"
                    value={umbral90Input}
                    onChange={(e) => setUmbral90Input(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50 font-bold text-sm text-red-900"
                  />
                  <p className="text-[10px] text-[#8E7D7D] mt-0.5">Propuesto: 90%</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE7DE]">
              <button
                type="button"
                onClick={() => setEditandoServicio(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8E7D7D] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarConfiguracion}
                disabled={guardando}
                className="px-5 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] cursor-pointer shadow-md disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEMÁS SERVICIOS: RENDER CLOUD Y SUPABASE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servicios
          .filter((s) => s.servicio !== "GOOGLE_MAPS")
          .map((srv) => (
            <div key={srv.id} className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C0A1E]/10 text-[#7C0A1E] flex items-center justify-center">
                      {srv.servicio === "RENDER" ? <Server size={20} /> : <Database size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#2D1A1E]">{srv.nombre_visible}</h3>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                        {srv.estado}
                      </span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-[#2D1A1E]">{srv.porcentaje_consumo}%</span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden my-3">
                  <div
                    className="h-full bg-[#7C0A1E] rounded-full"
                    style={{ width: `${srv.porcentaje_consumo}%` }}
                  />
                </div>

                <p className="text-xs text-[#8E7D7D]">{srv.notas}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-[#8E7D7D] pt-4 mt-4 border-t border-[#EFE7DE]">
                <span>
                  Uso: <strong className="text-[#2D1A1E]">{srv.consumo_actual}</strong> / {srv.cuota_mensual_limite}
                </span>
                <button
                  onClick={() => abrirEdicion(srv)}
                  className="font-bold text-[#7C0A1E] hover:underline cursor-pointer"
                >
                  Ajustar
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* HISTORIAL DE INCIDENTES Y REGISTRO DE RECUPERACIÓN */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DE]">
          <div>
            <h3 className="text-lg font-bold text-[#2D1A1E]">Historial de Incidentes y Recuperación</h3>
            <p className="text-xs text-[#8E7D7D]">
              Registro automático de avisos al 70%, alertas al 90%, límites alcanzados y eventos de contingencia.
            </p>
          </div>
        </div>

        {incidentes.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8E7D7D] flex flex-col items-center gap-2">
            <CheckCircle2 size={32} className="text-emerald-500" />
            <span>No se han registrado incidentes recientes. Todos los servicios operan normalmente.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFE7DE] text-[#8E7D7D] font-bold">
                  <th className="pb-2.5">Fecha y Hora</th>
                  <th className="pb-2.5">Servicio</th>
                  <th className="pb-2.5">Tipo de Evento</th>
                  <th className="pb-2.5">Descripción</th>
                  <th className="pb-2.5">Estado</th>
                  <th className="pb-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DE]/50">
                {incidentes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#FAF8F5] transition">
                    <td className="py-3 text-[#2D1A1E] font-medium whitespace-nowrap">
                      {formatFechaHora(inc.fecha_registro)}
                    </td>
                    <td className="py-3 font-bold text-[#7C0A1E]">{inc.servicio}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          inc.tipo_evento.includes("70")
                            ? "bg-blue-100 text-blue-800"
                            : inc.tipo_evento.includes("90")
                            ? "bg-amber-100 text-amber-800"
                            : inc.tipo_evento.includes("CONTINGENCIA") || inc.tipo_evento.includes("LIMITE")
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {inc.tipo_evento}
                      </span>
                    </td>
                    <td className="py-3 text-[#59494B] max-w-xs">{inc.descripcion}</td>
                    <td className="py-3">
                      {inc.resuelto ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <Check size={12} /> Resuelto
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1 text-[11px]">
                          <Flame size={12} /> Activo
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {!inc.resuelto && (
                        <button
                          onClick={() => handleResolverIncidente(inc.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          Resolver
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
