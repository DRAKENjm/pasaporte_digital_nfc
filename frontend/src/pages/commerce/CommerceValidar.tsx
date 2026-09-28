import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { useNFCReader } from "../../hooks/useNFCReader";
import { loadCommercePreferences } from "../../utils/commercePreferences";

export const CommerceValidar: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const preferences = useMemo(() => loadCommercePreferences(user?.id), [user?.id]);
  const { isScanning, isSupported, error: nfcError, startScan, stopScan } = useNFCReader();
  const uidRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const requestPending = useRef(false);

  // 4 Estados del Flujo Principal
  // 1: WAITING (LISTO PARA LEER)
  // 2: IDENTIFIED (CLIENTE IDENTIFICADO + DETALLES DE COMPRA)
  // 3: CONFIRMING (PROCESANDO VALIDACIÓN)
  // 4: SUCCESS (VISITA REGISTRADA)
  const [step, setStep] = useState<"WAITING" | "IDENTIFIED" | "SUCCESS">("WAITING");
  
  const [uidInput, setUidInput] = useState("");
  const [clienteData, setClienteData] = useState<any>(null);
  const [montoCompra, setMontoCompra] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [errorSucursales, setErrorSucursales] = useState("");
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string | null>(null);
  const [sellosActivos, setSellosActivos] = useState<any[]>([]);
  const [selectedPrograma, setSelectedPrograma] = useState<string | null>(null);
  const [errorSellos, setErrorSellos] = useState("");
  const [resultadoVisita, setResultadoVisita] = useState<any>(null);

  useEffect(() => {
    if (step === "WAITING" && preferences.modoLector === "USB_NFC" && !loading && !loadingSucursales) {
      uidRef.current?.focus();
    }
  }, [step, preferences.modoLector, loading, loadingSucursales]);

  useEffect(() => () => {
    void audioRef.current?.close().catch(() => {});
    audioRef.current = null;
  }, []);

  const cargarSellosDeSucursal = async (idSucursal: string) => {
    const res = await api.get(`/establishments/me/sellos?id_sucursal=${encodeURIComponent(idSucursal)}`);
    const activos = (res.data.data || []).filter((s: any) => s.estado === "ACTIVO");
    setSellosActivos(activos);
    setSelectedPrograma(activos[0] ? String(activos[0].id_programa) : null);
    setErrorSellos("");
  };

  // Cargar sucursales y los sellos del establecimiento de la sucursal elegida
  useEffect(() => {
    const fetchEstablecimiento = async () => {
      try {
        const resSuc = await api.get("/establishments/me/sucursales");
        const list = resSuc.data.data || [];
        setSucursales(list);
        const firstSucursal = list[0] ? String(list[0].id_sucursal) : null;
        setSelectedSucursal(firstSucursal);
        if (firstSucursal) await cargarSellosDeSucursal(firstSucursal);
      } catch (e) {
        setErrorSucursales("No se pudieron cargar tus sucursales o sus sellos. Recarga la página para intentarlo de nuevo.");
      } finally {
        setLoadingSucursales(false);
      }
    };
    fetchEstablecimiento();
  }, []);

  // 1. Identificar Tarjeta NFC
  const handleIdentificar = async (uid = uidInput) => {
    if (requestPending.current || loadingSucursales || !selectedSucursal) return;
    if (!uid.trim() || uid.trim().length > 100) {
      showToast("Ingresa o escanea el chip NFC", "error");
      return;
    }

    stopScan();
    requestPending.current = true;
    setLoading(true);
    try {
      const res = await api.post("/nfc/identificar", {
        uid_nfc: uid.trim()
      });
      setClienteData(res.data.data);
      setStep("IDENTIFIED");
      showToast("¡Cliente identificado con éxito!", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Tarjeta no registrada o inactiva", "error");
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  };

  // 2. Confirmar Visita y Entregar Sellos / Puntos
  const handleConfirmarVisita = async () => {
    if (requestPending.current) return;
    if (!clienteData || !selectedSucursal) {
      showToast("Faltan datos de la sucursal o del cliente", "error");
      return;
    }
    if (!sellosActivos.length) {
      showToast(errorSellos || "Esta sucursal no tiene diseños de sello activos", "error");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(montoCompra) ||
        !Number.isFinite(Number(montoCompra)) || Number(montoCompra) <= 0) {
      showToast("Ingresa un monto mayor a cero con hasta dos decimales", "error");
      return;
    }

    if (preferences.sonidoLectura) {
      try {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume().catch(() => {});
      } catch {
        // La visita puede registrarse aunque el navegador no admita audio.
      }
    }
    requestPending.current = true;
    setLoading(true);
    try {
      const res = await api.post("/nfc/confirmar-visita", {
        id_cliente: clienteData.cliente.id_cliente,
        id_tarjeta: clienteData.id_tarjeta,
        id_sucursal: selectedSucursal,
        monto_compra: montoCompra,
        id_programa: selectedPrograma || undefined
      });

      setResultadoVisita(res.data.data);
      setStep("SUCCESS");
      showToast("¡Visita registrada, sello y puntos acreditados!", "success");
      if (preferences.sonidoLectura && audioRef.current?.state === "running") {
        try {
          const audio = audioRef.current;
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          oscillator.frequency.value = 880;
          gain.gain.setValueAtTime(0.08, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.2);
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
          oscillator.start();
          oscillator.stop(audio.currentTime + 0.2);
        } catch {
          // Un fallo de sonido no debe convertir una visita confirmada en un error.
        }
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al registrar la visita", "error");
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  };

  // 3. Reiniciar para el siguiente cliente
  const handleSiguienteCliente = () => {
    if (loading) return;
    setStep("WAITING");
    setClienteData(null);
    setResultadoVisita(null);
    setMontoCompra("");
    setUidInput("");
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
              disabled={loading || isScanning || step === "SUCCESS"}
              onChange={async (e) => {
                const id = e.target.value;
                setSelectedSucursal(id);
                setLoadingSucursales(true);
                try {
                  await cargarSellosDeSucursal(id);
                } catch (error: any) {
                  setSellosActivos([]);
                  setSelectedPrograma(null);
                  setErrorSellos(error.response?.data?.message || "No se pudieron cargar los sellos de esta sucursal");
                } finally {
                  setLoadingSucursales(false);
                }
              }}
              className="bg-transparent border-none focus:outline-none font-bold text-xs"
            >
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>
                  {s.nombre_comercial} · {s.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(loadingSucursales || errorSucursales || !selectedSucursal) && (
        <p role="status" className="text-sm text-[#7C0A1E]">
          {loadingSucursales ? "Cargando sucursales asignadas..." :
            errorSucursales || "No tienes sucursales activas asignadas. Solicita la asignación al administrador."}
        </p>
      )}
      {!loadingSucursales && selectedSucursal && (errorSellos || sellosActivos.length === 0) && (
        <p role="status" className="text-sm text-[#7C0A1E]">
          {errorSellos || "Esta sucursal no tiene sellos activos. Activa o crea un diseño en Mi Sello Digital."}
        </p>
      )}

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
              {preferences.modoLector === "MANUAL" ? "Ingresa el UID de la tarjeta" : "Acerca la tarjeta NFC"}
            </h2>
            <p className="text-xs text-[#8E7D7D]">
              {preferences.modoLector === "USB_NFC"
                ? "Mantén el campo UID enfocado y acerca la tarjeta al lector configurado como teclado."
                : preferences.modoLector === "WEB_NFC"
                  ? "Inicia la lectura NFC o ingresa el UID manualmente."
                  : "Escribe el UID asignado al cliente para identificarlo."}
            </p>
          </div>

          {/* Formulario / Input de UID */}
          {preferences.modoLector === "WEB_NFC" && (
            <div className="w-full max-w-md space-y-2">
              <button
                type="button"
                disabled={loading || loadingSucursales || !selectedSucursal || !isSupported || !window.isSecureContext}
                onClick={() => {
                  if (isScanning) { stopScan(); return; }
                  void startScan(result => {
                    if (!result.serialNumber) {
                      showToast("La tarjeta no proporcionó un UID. Ingrésalo manualmente.", "error");
                      return;
                    }
                    setUidInput(result.serialNumber);
                    void handleIdentificar(result.serialNumber);
                  });
                }}
                className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold disabled:opacity-50"
              >
                {isScanning ? "Cancelar lectura NFC" : "Iniciar lectura NFC"}
              </button>
              {(!isSupported || !window.isSecureContext) && <p role="status" className="text-xs text-[#8E7D7D]">Web NFC requiere HTTPS y un navegador compatible. Puedes ingresar el UID manualmente.</p>}
              {nfcError && <p role="alert" className="text-xs text-[#7C0A1E]">{nfcError}</p>}
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); void handleIdentificar(); }} className="w-full max-w-md space-y-3 pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                ref={uidRef}
                aria-label="UID de la tarjeta NFC"
                maxLength={100}
                disabled={loading || isScanning}
                placeholder="UID de Tarjeta (ej. 04:A1:B2:C3:D4:E5:1234)"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-[#EFE7DE] text-xs font-mono font-bold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
              <button
                type="submit"
                disabled={loading || isScanning || loadingSucursales || !selectedSucursal}
                className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : "IDENTIFICAR"}
              </button>
            </div>
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
                    step="0.01"
                    min="0.01"
                    disabled={loading}
                    value={montoCompra}
                    onChange={(e) => setMontoCompra(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-sm font-black text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                  />
                </div>
              </div>

              {/* Sello a otorgar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Sello a Otorgar
                </label>
                {sellosActivos.length > 1 ? (
                  <select
                    value={selectedPrograma || ""}
                    disabled={loading}
                    onChange={(e) => setSelectedPrograma(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] bg-rose-50 text-[#7C0A1E] font-black text-sm focus:outline-none focus:border-[#7C0A1E]"
                  >
                    {sellosActivos.map((s) => (
                      <option key={s.id_programa} value={s.id_programa}>
                        {s.nombre_sello || "Sello"} · meta {s.meta_sellos}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-black text-sm flex items-center justify-between">
                    <span>{sellosActivos[0]?.nombre_sello || "+1 Sello"}</span>
                    <Award size={18} />
                  </div>
                )}
              </div>

              {/* Puntos a otorgar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Puntos a Entregar
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-[#C5A059]/30 text-amber-900 font-black text-sm flex items-center justify-between">
                  <span>+{sellosActivos.find((s) => String(s.id_programa) === selectedPrograma)?.puntos_por_visita ?? 20} puntos</span>
                  <Sparkles size={18} className="text-[#C5A059]" />
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#EFE7DE]">
              <button
                type="button"
                onClick={handleSiguienteCliente}
                disabled={loading || !sellosActivos.length}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#8E7D7D] text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancelar Lectura
              </button>
              
              <button
                type="button"
                onClick={handleConfirmarVisita}
                disabled={loading || !sellosActivos.length}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-black hover:bg-[#600616] active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>REGISTRANDO VISITA...</span>
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
              <span className="text-xl font-black text-[#7C0A1E]">+1 Sello</span>
              {resultadoVisita?.sello?.nombre_sello && (
                <span className="text-[10px] font-bold text-[#8E7D7D] block">
                  {resultadoVisita.sello.nombre_sello}
                </span>
              )}
            </div>
            <div className="h-8 w-px bg-[#EFE7DE]" />
            <div>
              <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Puntos Ganados</span>
              <span className="text-xl font-black text-[#C5A059]">+{resultadoVisita?.puntos?.puntos_ganados ?? 0} pts</span>
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
