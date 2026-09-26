import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  DollarSign, 
  Award, 
  RotateCw, 
  Sparkles, 
  User, 
  CreditCard,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { useAuth } from "../../hooks/useAuth";

export const CommerceValidar: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();

  // 4 Estados del Flujo Principal
  // 1: WAITING (LISTO PARA LEER)
  // 2: IDENTIFIED (CLIENTE IDENTIFICADO + DETALLES DE COMPRA)
  // 3: CONFIRMING (PROCESANDO VALIDACIÓN)
  // 4: SUCCESS (VISITA REGISTRADA)
  const [step, setStep] = useState<"WAITING" | "IDENTIFIED" | "SUCCESS">("WAITING");
  
  const [uidInput, setUidInput] = useState("04:A1:B2:C3:D4:E5:1234");
  const [clienteData, setClienteData] = useState<any>(null);
  const [montoCompra, setMontoCompra] = useState("35.00");
  const [puntosAEntregar, setPuntosAEntregar] = useState(20);
  const [sellosAEntregar, setSellosAEntregar] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<number | null>(null);
  const [resultadoVisita, setResultadoVisita] = useState<any>(null);

  // Cargar sucursales del usuario / establecimiento
  useEffect(() => {
    const fetchEstablecimiento = async () => {
      try {
        const res = await api.get("/establishments");
        const list = res.data.data;
        if (list && list.length > 0) {
          const prim = list[0];
          setSucursales(prim.sucursales || []);
          if (prim.sucursales && prim.sucursales.length > 0) {
            setSelectedSucursal(prim.sucursales[0].id_sucursal);
          }
          if (prim.puntos_por_visita) {
            setPuntosAEntregar(Number(prim.puntos_por_visita) || 20);
          }
        }
      } catch (e) {
        console.error("Error al cargar sucursales", e);
      }
    };
    fetchEstablecimiento();
  }, []);

  // 1. Identificar Tarjeta NFC
  const handleIdentificar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uidInput.trim()) {
      showToast("Ingresa o escanea el chip NFC", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/nfc/identificar", {
        uid_nfc: uidInput.trim()
      });
      setClienteData(res.data.data);
      setStep("IDENTIFIED");
      showToast("¡Cliente identificado con éxito!", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Tarjeta no registrada o inactiva", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirmar Visita y Entregar Sellos / Puntos
  const handleConfirmarVisita = async () => {
    if (!clienteData || !selectedSucursal) {
      showToast("Faltan datos de la sucursal o del cliente", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/nfc/confirmar-visita", {
        id_cliente: clienteData.cliente.id_cliente,
        id_tarjeta: clienteData.id_tarjeta,
        id_sucursal: selectedSucursal,
        observacion: `Compra S/ ${montoCompra || "0.00"}`
      });

      setResultadoVisita(res.data.data);
      setStep("SUCCESS");
      showToast("¡Visita registrada, sello y puntos acreditados!", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al registrar la visita", "error");
    } finally {
      setLoading(false);
    }
  };

  // 3. Reiniciar para el siguiente cliente
  const handleSiguienteCliente = () => {
    setStep("WAITING");
    setClienteData(null);
    setResultadoVisita(null);
    setMontoCompra("35.00");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Terminal de Validación NFC</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Registro de visitas presenciales, sellos digitales y puntos por compra
          </p>
        </div>

        {sucursales.length > 1 && (
          <div className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#2D1A1E]">
            <Store className="w-4 h-4 text-[#7C0A1E]" />
            <select
              value={selectedSucursal || ""}
              onChange={(e) => setSelectedSucursal(Number(e.target.value))}
              className="bg-transparent border-none focus:outline-none font-bold text-xs"
            >
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ESTADO 1: LISTO PARA LEER */}
      {step === "WAITING" && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE7DE] shadow-sm text-center flex flex-col items-center justify-center space-y-6 animate-fadeIn">
          {/* Ilustración de Ondas NFC Animadas */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#C5A059]/30 animate-ping opacity-60" />
            <div className="absolute w-32 h-32 rounded-full border-2 border-[#7C0A1E]/20 animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7C0A1E] to-[#4A040F] text-white flex items-center justify-center shadow-xl z-10">
              <Wifi size={44} className="rotate-90 text-[#FAF8F5]" />
            </div>
          </div>

          <div className="space-y-1 max-w-sm">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#C5A059] bg-amber-50 px-3 py-1 rounded-full border border-[#C5A059]/30">
              LISTO PARA LEER
            </span>
            <h2 className="text-2xl font-black text-[#2D1A1E] pt-2">
              Acerque la tarjeta NFC
            </h2>
            <p className="text-xs text-[#8E7D7D]">
              Aproxime la tarjeta del cliente al lector USB o ingrese el UID asignado
            </p>
          </div>

          {/* Formulario / Input de UID */}
          <form onSubmit={handleIdentificar} className="w-full max-w-md space-y-3 pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="UID de Tarjeta (ej. 04:A1:B2:C3:D4:E5:1234)"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-[#EFE7DE] text-xs font-mono font-bold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : "LEER NFC"}
              </button>
            </div>
            <p className="text-[10px] text-[#8E7D7D] font-mono">
              Tarjeta Demo Cliente: 04:A1:B2:C3:D4:E5:1234
            </p>
          </form>
        </div>
      )}

      {/* ESTADO 2: CLIENTE IDENTIFICADO + CONFIGURACIÓN DE VISITA */}
      {step === "IDENTIFIED" && clienteData && (
        <div className="space-y-5 animate-fadeIn">
          {/* Card de Información del Cliente */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-[#7C0A1E]/30 text-[#7C0A1E] font-black text-xl flex items-center justify-center shadow-inner">
                {clienteData.cliente?.nombres?.charAt(0) || "J"}
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  ✓ Cliente Identificado
                </span>
                <h2 className="text-xl font-black text-[#2D1A1E] mt-0.5">
                  {clienteData.cliente?.nombres} {clienteData.cliente?.apellidos || ""}
                </h2>
                <p className="text-xs text-[#8E7D7D] font-mono">
                  Código: {clienteData.cliente?.codigo_cliente || "CLI-100234"} · Tarjeta: {clienteData.codigo_interno || "NFC-101234"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EFE7DE]">
              <div className="bg-[#FAF8F5] border border-[#EFE7DE] px-4 py-2.5 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Puntos Globales</span>
                <span className="text-base font-black text-[#7C0A1E]">{clienteData.cliente?.puntos_actuales ?? 0} pts</span>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EFE7DE] px-4 py-2.5 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Visitas en Local</span>
                <span className="text-base font-black text-[#C5A059]">Frecuente</span>
              </div>
            </div>
          </div>

          {/* Formulario de Confirmación de Consumo */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Input Compra */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Monto de Compra
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-[#8E7D7D]">S/</span>
                  <input
                    type="number"
                    step="0.50"
                    value={montoCompra}
                    onChange={(e) => setMontoCompra(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-sm font-black text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                  />
                </div>
              </div>

              {/* Sello a otorgar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Sello Digital
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-black text-sm flex items-center justify-between">
                  <span>+1 Sello</span>
                  <Award size={18} />
                </div>
              </div>

              {/* Puntos a otorgar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Puntos a Entregar
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-[#C5A059]/30 text-amber-900 font-black text-sm flex items-center justify-between">
                  <span>+{puntosAEntregar} Puntos</span>
                  <Sparkles size={18} className="text-[#C5A059]" />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#EFE7DE]">
              <button
                type="button"
                onClick={handleSiguienteCliente}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#8E7D7D] text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancelar Lectura
              </button>
              
              <button
                type="button"
                onClick={handleConfirmarVisita}
                disabled={loading}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-black hover:bg-[#600616] active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>REGISTRANDO EN BLOCKCHAIN / LEDGER...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRMAR VISITA Y ENTREGAR SELLOS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO 4: VISITA REGISTRADA CON ÉXITO */}
      {step === "SUCCESS" && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EFE7DE] shadow-sm text-center flex flex-col items-center justify-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg animate-bounce">
            <CheckCircle2 size={42} />
          </div>

          <div className="space-y-1 max-w-sm">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/30">
              OPERACIÓN EXITOSA
            </span>
            <h2 className="text-2xl font-black text-[#2D1A1E] pt-2">
              VISITA REGISTRADA
            </h2>
            <p className="text-xs text-[#8E7D7D]">
              Se ha actualizado el Pasaporte Digital del cliente en tiempo real.
            </p>
          </div>

          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE7DE] p-5 rounded-2xl flex items-center justify-around">
            <div>
              <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Sellos</span>
              <span className="text-xl font-black text-[#7C0A1E]">+{sellosAEntregar} Sello</span>
            </div>
            <div className="h-8 w-px bg-[#EFE7DE]" />
            <div>
              <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Puntos Ganados</span>
              <span className="text-xl font-black text-[#C5A059]">+{puntosAEntregar} pts</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSiguienteCliente}
            className="w-full max-w-md py-4 rounded-2xl bg-[#7C0A1E] text-white text-xs font-black hover:bg-[#600616] active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ATENDER SIGUIENTE CLIENTE</span>
          </button>
        </div>
      )}
    </div>
  );
};
