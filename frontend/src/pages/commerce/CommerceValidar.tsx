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
  ShieldCheck,
  QrCode,
  Camera,
  ScanLine,
  Smartphone,
  Info
} from "lucide-react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { useAuth } from "../../hooks/useAuth";
import { useNFCReader } from "../../hooks/useNFCReader";
import { loadCommercePreferences } from "../../utils/commercePreferences";
import { QRScanner } from "../../components/nfc/QRScanner";

export const CommerceValidar: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const preferences = useMemo(() => loadCommercePreferences(user?.id), [user?.id]);
  const { isScanning, isSupported, error: nfcError, startScan, stopScan } = useNFCReader();
  const uidRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const requestPending = useRef(false);

  // Modo de validación: NFC o QR de Respaldo
  const [metodoValidacion, setMetodoValidacion] = useState<"NFC" | "QR">("NFC");
  const [mostrarCamaraQr, setMostrarCamaraQr] = useState(false);

  // 4 Estados del Flujo Principal
  // 1: WAITING (LISTO PARA LEER)
  // 2: IDENTIFIED (CLIENTE IDENTIFICADO + DETALLES DE COMPRA)
  // 3: CONFIRMING (PROCESANDO VALIDACIÓN)
  // 4: SUCCESS (VISITA REGISTRADA)
  const [step, setStep] = useState<"WAITING" | "IDENTIFIED" | "SUCCESS">("WAITING");
  
  const [uidInput, setUidInput] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [clienteData, setClienteData] = useState<any>(null);
  const [montoCompra, setMontoCompra] = useState("");
  const [puntosRegalo, setPuntosRegalo] = useState("");
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

  const emitirBeep = (frecuencia = 880) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      audioRef.current ??= new AudioCtx();
      if (audioRef.current.state === "suspended") {
        void audioRef.current.resume().catch(() => {});
      }
      const audio = audioRef.current;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.setValueAtTime(frecuencia, audio.currentTime);
      gain.gain.setValueAtTime(0.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start();
      osc.stop(audio.currentTime + 0.18);
    } catch {
      // Audio playback fallback
    }
  };

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
        uid_nfc: uid.trim(),
        id_sucursal: selectedSucursal,
      });
      setClienteData(res.data.data);
      setStep("IDENTIFIED");
      if (preferences.sonidoLectura) {
        emitirBeep(880);
      }
      showToast("¡Cliente identificado con éxito!", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Tarjeta sin información o no registrada", "error");
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  };

  // 1.B Identificar por Código QR de Respaldo
  const handleIdentificarQr = async (codigo = qrInput) => {
    if (requestPending.current || loadingSucursales || !selectedSucursal) return;
    if (!codigo.trim()) {
      showToast("Escanea o escribe el código QR de respaldo", "error");
      return;
    }

    setMostrarCamaraQr(false);
    requestPending.current = true;
    setLoading(true);
    try {
      const res = await api.post("/nfc/identificar", {
        qr_code: codigo.trim(),
        id_sucursal: selectedSucursal,
      });
      setClienteData(res.data.data);
      setStep("IDENTIFIED");
      if (preferences.sonidoQr) {
        emitirBeep(1046);
      }
      showToast("¡Cliente identificado por QR de respaldo!", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Código QR sin información o no registrado", "error");
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

    const tieneCompra = montoCompra.trim() !== "";
    if (tieneCompra) {
      if (!/^\d+(\.\d{1,2})?$/.test(montoCompra) ||
          !Number.isFinite(Number(montoCompra)) || Number(montoCompra) < 0) {
        showToast("El monto de compra debe ser un número positivo con hasta dos decimales", "error");
        return;
      }
    }

    // Si ya tiene sello hoy, no puede registrar visita vacía de 0 pts sin compra ni regalo
    if (clienteData.ya_tiene_sello_hoy) {
      const ptsRegaloNum = puntosRegalo ? Number(puntosRegalo) : 0;
      const montoNum = tieneCompra ? Number(montoCompra) : 0;
      if (montoNum <= 0 && ptsRegaloNum <= 0) {
        showToast("El cliente ya recibió su sello de hoy. Ingresa un monto de compra o puntos de regalo para registrar este consumo.", "error");
        return;
      }
    }

    requestPending.current = true;
    setLoading(true);
    try {
      const res = await api.post("/nfc/confirmar-visita", {
        id_cliente: clienteData.cliente.id_cliente,
        id_tarjeta: clienteData.id_tarjeta,
        id_sucursal: selectedSucursal,
        monto_compra: tieneCompra && Number(montoCompra) > 0 ? montoCompra : undefined,
        puntos_regalo: puntosRegalo ? Number(puntosRegalo) : 0,
        id_programa: selectedPrograma || undefined,
        metodo_validacion: clienteData.metodo_identificacion || metodoValidacion,
      });

      setResultadoVisita(res.data.data);
      setStep("SUCCESS");
      showToast("¡Visita registrada, sello y puntos acreditados!", "success");
      const sonidoHabilitado = (clienteData.metodo_identificacion === "QR" || metodoValidacion === "QR") 
        ? preferences.sonidoQr 
        : preferences.sonidoLectura;
      if (sonidoHabilitado) {
        emitirBeep(880);
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
    setPuntosRegalo("");
    setUidInput("");
    setQrInput("");
    setMostrarCamaraQr(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Terminal de Validación NFC</h1>
          <p className="text-xs text-[#8E7D7D] mt-0.5">
            Registro de visitas presenciales, sellos digitales y puntos por compra
          </p>
        </div>

        {sucursales.length > 1 && (
          <div className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3 py-2 rounded-xl text-xs font-semibold text-[#2D1A1E] w-full sm:w-auto">
            <Store className="w-4 h-4 text-[#7C0A1E] shrink-0" />
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

      {/* SELECTOR DE MÉTODO DE VALIDACIÓN: NFC vs QR DE RESPALDO */}
      {step === "WAITING" && (
        <div className="flex justify-center">
          <div className="bg-white p-1 rounded-2xl border border-[#EFE7DE] shadow-xs flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMetodoValidacion("NFC");
                setMostrarCamaraQr(false);
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                metodoValidacion === "NFC"
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E]"
              }`}
            >
              <Wifi size={14} className="rotate-90" />
              <span>Lector Tarjeta NFC</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMetodoValidacion("QR");
                stopScan();
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                metodoValidacion === "QR"
                  ? "bg-[#7C0A1E] text-white shadow-xs"
                  : "text-[#8E7D7D] hover:text-[#2D1A1E]"
              }`}
            >
              <QrCode size={14} />
              <span>QR de Respaldo</span>
            </button>
          </div>
        </div>
      )}

      {/* ESTADO 1: LISTO PARA LEER (NFC O QR) */}
      {step === "WAITING" && metodoValidacion === "NFC" && (
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
              LISTO PARA LEER NFC
            </span>
            <h2 className="text-2xl font-black text-[#2D1A1E] pt-2">
              Acerca la tarjeta NFC
            </h2>
            <p className="text-xs text-[#8E7D7D]">
              {isSupported
                ? "Puedes usar el lector NFC del teléfono o un lector USB conectado."
                : "Acerca la tarjeta al lector USB conectado o ingresa el UID."}
            </p>
          </div>

          {/* Botón de lectura Web NFC para Móviles / Navegadores compatibles */}
          {isSupported ? (
            <div className="w-full max-w-md space-y-2">
              <button
                type="button"
                disabled={loading || loadingSucursales || !selectedSucursal}
                onClick={() => {
                  if (isScanning) {
                    stopScan();
                    return;
                  }
                  void startScan((result) => {
                    if (!result.serialNumber) {
                      showToast("La tarjeta no proporcionó un UID válido. Ingrésalo manualmente.", "error");
                      return;
                    }
                    setUidInput(result.serialNumber);
                    void handleIdentificar(result.serialNumber);
                  });
                }}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isScanning
                    ? "bg-amber-600 text-white animate-pulse"
                    : "bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] text-white hover:bg-[#600616] active:scale-95"
                } disabled:opacity-50`}
              >
                <Smartphone size={16} />
                <span>
                  {isScanning
                    ? "Escaneando... acerca la tarjeta al teléfono (Click para cancelar)"
                    : "Activar lector NFC del teléfono"}
                </span>
              </button>
              {nfcError && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-left flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-red-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs text-red-700 font-semibold">{nfcError}</p>
                    <p className="text-[11px] text-[#8E7D7D]">
                      Si el teléfono no posee sensor NFC o está desactivado, selecciona la opción <strong>QR de Respaldo</strong> o conecta un lector USB.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Smartphone size={14} className="shrink-0 text-amber-700" />
                <span>Sensor NFC no detectado en este navegador</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed pl-5">
                Este dispositivo o navegador no admite la lectura Web NFC directa. Puedes conectar un lector USB en la computadora o usar la pestaña <strong>QR de Respaldo</strong> para validar la visita.
              </p>
            </div>
          )}

          {/* Formulario / Input de UID (compatible con lector USB emulador de teclado o ingreso manual) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleIdentificar();
            }}
            className="w-full max-w-md space-y-2 pt-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                ref={uidRef}
                aria-label="UID de la tarjeta NFC"
                maxLength={100}
                disabled={loading || isScanning}
                placeholder="UID de Tarjeta (ej. 04:A1:B2:C3:D4:E5:12)"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-[#EFE7DE] text-xs font-mono font-bold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E] bg-[#FAF8F5]/50"
              />
              <button
                type="submit"
                disabled={loading || isScanning || loadingSucursales || !selectedSucursal}
                className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : "IDENTIFICAR"}
              </button>
            </div>
            <p className="text-[11px] text-[#8E7D7D] text-center flex items-center justify-center gap-1.5">
              <Info size={12} className="text-[#C5A059]" />
              <span>Lectores USB: al apoyar la tarjeta el UID se enviará de forma automática.</span>
            </p>
          </form>
        </div>
      )}

      {/* ESTADO 1.B: VALIDACIÓN POR QR DE RESPALDO */}
      {step === "WAITING" && metodoValidacion === "QR" && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#EFE7DE] shadow-sm text-center flex flex-col items-center justify-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-[#C5A059]/30 text-[#7C0A1E] flex items-center justify-center shadow-inner">
            <QrCode size={40} className="text-[#7C0A1E]" />
          </div>

          <div className="space-y-1 max-w-sm">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#C5A059] bg-amber-50 px-3 py-1 rounded-full border border-[#C5A059]/30">
              RESPALDO DIGITAL
            </span>
            <h2 className="text-2xl font-black text-[#2D1A1E] pt-2">
              Escanear QR del Cliente
            </h2>
            <p className="text-xs text-[#8E7D7D]">
              Si el cliente no llevó su tarjeta NFC física, escanea con la cámara su pantalla o escribe su código de pasaporte.
            </p>
          </div>

          {/* Cámara Scanner QR */}
          <div className="w-full max-w-md space-y-3">
            <button
              type="button"
              onClick={() => setMostrarCamaraQr(!mostrarCamaraQr)}
              className="w-full py-3 px-4 rounded-2xl bg-[#FAF8F5] border border-[#C5A059] text-[#7C0A1E] text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors"
            >
              <Camera size={16} />
              <span>{mostrarCamaraQr ? "Cerrar cámara" : "Escanear con cámara del dispositivo"}</span>
            </button>

            {mostrarCamaraQr && (
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EFE7DE]">
                <QRScanner
                  onScanCode={(code) => {
                    setQrInput(code);
                    void handleIdentificarQr(code);
                  }}
                />
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleIdentificarQr();
              }}
              className="flex gap-2 pt-2"
            >
              <input
                type="text"
                aria-label="Código QR o código de cliente"
                disabled={loading}
                placeholder="Código de Respaldo (ej. NFC-101234 o CLI-100234)"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-[#EFE7DE] text-xs font-mono font-bold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
              <button
                type="submit"
                disabled={loading || loadingSucursales || !selectedSucursal}
                className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : "VALIDAR QR"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ESTADO 2: CLIENTE IDENTIFICADO + CONFIGURACIÓN DE VISITA */}
      {step === "IDENTIFIED" && clienteData && (
        <div className="space-y-5 animate-fadeIn">
          {/* Card de Información del Cliente (Limpia, sobria, sin datos confusos) */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE7DE] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-[#7C0A1E]/30 text-[#7C0A1E] font-black text-xl flex items-center justify-center shadow-inner">
                {clienteData.cliente?.nombres?.charAt(0) || "C"}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Cliente Identificado
                </span>
                <h2 className="text-lg font-black text-[#2D1A1E]">
                  {clienteData.cliente?.nombres} {clienteData.cliente?.apellidos || ""}
                </h2>
                <p className="text-xs text-[#8E7D7D] font-mono">
                  {clienteData.codigo_interno ? `Tarjeta: ${clienteData.codigo_interno}` : `Código: ${clienteData.cliente?.codigo_cliente || "Registrado"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EFE7DE]">
              <div className="bg-[#FAF8F5] border border-[#EFE7DE] px-4 py-2 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Estado del Sello</span>
                <span className={`text-xs font-black ${clienteData.ya_tiene_sello_hoy ? "text-amber-700" : "text-emerald-700"}`}>
                  {clienteData.ya_tiene_sello_hoy ? "Sello de hoy completado" : "Pendiente de sellar"}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario Dinámico: Sello de Hoy vs Consumo Adicional */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-6">
            {!clienteData.ya_tiene_sello_hoy ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <p className="leading-snug">
                  <strong>Primera visita del día:</strong> Al confirmar se otorgará su sello digital de hoy y sus puntos de visita correspondientes. Si realizó alguna compra, puedes registrarla a continuación.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
                <Award size={18} className="shrink-0 text-amber-600" />
                <p className="leading-snug">
                  <strong>Sello de hoy ya completado:</strong> El cliente ya tiene su sello oficial de hoy en este establecimiento. Esta visita registrará únicamente sus <strong>puntos por consumo o cortesía</strong>.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sello a Otorgar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  {clienteData.ya_tiene_sello_hoy ? "Estado del Sello" : "Sello de Hoy"}
                </label>
                {clienteData.ya_tiene_sello_hoy ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
                    <span>1 Sello otorgado hoy</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-extrabold uppercase">
                      Al día
                    </span>
                  </div>
                ) : sellosActivos.length > 1 ? (
                  <select
                    value={selectedPrograma || ""}
                    disabled={loading}
                    onChange={(e) => setSelectedPrograma(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EFE7DE] bg-rose-50 text-[#7C0A1E] font-black text-xs focus:outline-none focus:border-[#7C0A1E]"
                  >
                    {sellosActivos.map((s) => (
                      <option key={s.id_programa} value={s.id_programa}>
                        {s.nombre_sello || "Sello"} · +{s.puntos_por_visita || 20} pts
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] font-black text-xs flex items-center justify-between">
                    <span>{sellosActivos[0]?.nombre_sello || "Sello Oficial"}</span>
                    <Award size={16} />
                  </div>
                )}
                <p className="text-[10px] text-[#8E7D7D]">
                  {clienteData.ya_tiene_sello_hoy
                    ? "Máximo 1 sello por día por cliente"
                    : `+${sellosActivos.find((s) => String(s.id_programa) === selectedPrograma)?.puntos_por_visita || clienteData.puntos_por_visita || 20} pts por sello`}
                </p>
              </div>

              {/* Input Compra */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Monto de Compra {clienteData.ya_tiene_sello_hoy ? "(Requerido)" : "(Opcional)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-[#8E7D7D]">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={loading}
                    value={montoCompra}
                    onChange={(e) => setMontoCompra(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-sm font-black text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                  />
                </div>
                <p className="text-[10px] text-[#8E7D7D]">
                  Regla: +1 pt por cada S/ {clienteData.monto_por_punto || 10}
                </p>
              </div>

              {/* Puntos de Regalo Opcionales */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Puntos de Regalo / Bono
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0 (opcional)"
                  disabled={loading}
                  value={puntosRegalo}
                  onChange={(e) => setPuntosRegalo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-sm font-black text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
                />
                <p className="text-[10px] text-[#8E7D7D]">
                  Cortesía, promoción o evento
                </p>
              </div>

              {/* Total Puntos Calculados */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Total Puntos a Entregar
                </label>
                {(() => {
                  const ptsSello = clienteData.ya_tiene_sello_hoy
                    ? 0
                    : Number(sellosActivos.find((s) => String(s.id_programa) === selectedPrograma)?.puntos_por_visita || clienteData.puntos_por_visita || 20);
                  const ratio = Number(clienteData.monto_por_punto) > 0 ? Number(clienteData.monto_por_punto) : 10;
                  const ptsConsumo = Math.floor(Number(montoCompra || 0) / ratio);
                  const ptsExtra = Math.max(0, Math.floor(Number(puntosRegalo || 0)));
                  const total = ptsSello + ptsConsumo + ptsExtra;

                  return (
                    <div>
                      <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-[#C5A059]/30 text-amber-900 font-black text-sm flex items-center justify-between">
                        <span>+{total} pts</span>
                        <Sparkles size={16} className="text-[#C5A059]" />
                      </div>
                      <p className="text-[10px] text-[#8E7D7D] mt-1">
                        {ptsSello > 0 && `${ptsSello} sello `}
                        {ptsConsumo > 0 && `+ ${ptsConsumo} compra `}
                        {ptsExtra > 0 && `+ ${ptsExtra} regalo`}
                        {total === 0 && "0 puntos calculados"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {clienteData.ya_tiene_sello_hoy && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
                <Award size={18} className="shrink-0 text-amber-600" />
                <p className="leading-snug">
                  Este cliente ya recibió su sello oficial de hoy en este establecimiento. Esta visita acumulará <strong>puntos por consumo y cortesía</strong> sin duplicar sellos.
                </p>
              </div>
            )}

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
                    <span>
                      {clienteData.ya_tiene_sello_hoy
                        ? "REGISTRAR VISITA Y ENTREGAR PUNTOS"
                        : "CONFIRMAR VISITA Y ENTREGAR SELLOS"}
                    </span>
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

          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE7DE] p-5 rounded-2xl flex items-center justify-around text-center">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Sellos Digitales</span>
              {resultadoVisita?.sello_otorgado !== false ? (
                <>
                  <span className="text-xl font-black text-[#7C0A1E]">+1 Sello</span>
                  <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                    {resultadoVisita?.sello?.nombre_sello || "Sello Otorgado"}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-[#8E7D7D] block">0 Sellos</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-amber-200">
                    Sello de hoy ya obtenido
                  </span>
                </>
              )}
            </div>

            <div className="h-10 w-px bg-[#EFE7DE] mx-2" />

            <div className="flex-1">
              <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Puntos Ganados</span>
              <span className="text-xl font-black text-[#C5A059]">
                +{resultadoVisita?.puntos?.puntos_ganados ?? 0} pts
              </span>
              <span className="text-[10px] text-[#8E7D7D] block mt-0.5">
                Saldo: {resultadoVisita?.puntos?.saldo_actual ?? 0} pts
              </span>
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
