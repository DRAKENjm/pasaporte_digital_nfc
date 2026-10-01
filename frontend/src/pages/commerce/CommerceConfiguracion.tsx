import React, { useEffect, useState } from "react";
import { Volume2, VolumeX, Save, CheckCircle2, ShieldCheck, Laptop, QrCode } from "lucide-react";
import { useUI } from "../../hooks/useUI";
import { useAuth } from "../../hooks/useAuth";
import { isReaderMode, loadCommercePreferences, saveCommercePreferences } from "../../utils/commercePreferences";

export const CommerceConfiguracion: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(() => loadCommercePreferences(user?.id));
  const { sonidoLectura, sonidoQr, modoLector } = preferences;
  const webNfcSupported = "NDEFReader" in window && window.isSecureContext;
  const [saved, setSaved] = useState(false);
  const { showToast } = useUI();

  const playPreviewSound = (freq = 880) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio preview fallback
    }
  };

  useEffect(() => {
    setPreferences(loadCommercePreferences(user?.id));
    setSaved(false);
  }, [user?.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (modoLector === "WEB_NFC" && !webNfcSupported) {
      showToast("Web NFC requiere HTTPS y un navegador compatible. Selecciona otro modo.", "error");
      return;
    }
    try {
      saveCommercePreferences(user.id, preferences);
      setSaved(true);
      showToast("Preferencias guardadas para tu cuenta en este navegador", "success");
    } catch {
      setSaved(false);
      showToast("No se pudieron guardar las preferencias. Revisa los permisos de almacenamiento del navegador.", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Configuración de Terminal</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Preferencias de lectura y sonido para tu cuenta en este navegador
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Parámetros de Hardware */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
            <Laptop className="w-4 h-4 text-[#7C0A1E]" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Dispositivo de Lectura NFC</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commerce-reader-mode" className="text-[11px] font-bold text-[#8E7D7D] block mb-1 uppercase">
                Modo del Sensor
              </label>
              <select
                id="commerce-reader-mode"
                value={modoLector}
                onChange={(e) => {
                  if (isReaderMode(e.target.value)) {
                    setPreferences({ ...preferences, modoLector: e.target.value });
                    setSaved(false);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              >
                <option value="USB_NFC">Lector USB configurado como teclado</option>
                <option value="WEB_NFC" disabled={!webNfcSupported}>Web NFC (navegador compatible)</option>
                <option value="MANUAL">Ingreso Manual / Teclado</option>
              </select>
              <p className="text-[11px] text-[#8E7D7D] mt-2">
                {modoLector === "USB_NFC"
                  ? "El lector debe escribir el UID en el campo de texto. Si envía Enter, se identifica la tarjeta."
                  : modoLector === "WEB_NFC"
                    ? "La lectura se inicia desde Validar NFC y requiere permiso del navegador."
                    : "Escribe el UID de la tarjeta y pulsa Identificar."}
                {!webNfcSupported && " Web NFC no está disponible en este navegador o conexión."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] block uppercase">
                  Alerta Sonora al Validar NFC
                </label>
                {sonidoLectura && (
                  <button
                    type="button"
                    onClick={() => playPreviewSound(880)}
                    className="text-[10px] text-[#7C0A1E] hover:underline font-semibold"
                  >
                    Probar tono
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-pressed={sonidoLectura}
                onClick={() => {
                  setPreferences({ ...preferences, sonidoLectura: !sonidoLectura });
                  setSaved(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  sonidoLectura
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-[#FAF8F5] border-[#EFE7DE] text-[#8E7D7D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {sonidoLectura ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {sonidoLectura ? "Sonido NFC Activado" : "NFC Silenciado"}
                </span>
                <span className="text-[10px] uppercase font-bold">{sonidoLectura ? "ON" : "OFF"}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#8E7D7D] block uppercase">
                  Alerta Sonora al Escanear QR
                </label>
                {sonidoQr && (
                  <button
                    type="button"
                    onClick={() => playPreviewSound(1046)}
                    className="text-[10px] text-[#7C0A1E] hover:underline font-semibold"
                  >
                    Probar tono
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-pressed={sonidoQr}
                onClick={() => {
                  setPreferences({ ...preferences, sonidoQr: !sonidoQr });
                  setSaved(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  sonidoQr
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-[#FAF8F5] border-[#EFE7DE] text-[#8E7D7D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <QrCode size={16} className={sonidoQr ? "text-emerald-700" : "text-[#8E7D7D]"} />
                  {sonidoQr ? "Sonido QR Activado" : "QR Silenciado"}
                </span>
                <span className="text-[10px] uppercase font-bold">{sonidoQr ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Políticas Antifraude Locales */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Seguridad y Antifraude Activo</h3>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] space-y-1.5 text-xs">
            <p className="font-bold text-[#2D1A1E]">Confirmación manual de cada visita</p>
            <p className="text-[11px] text-[#8E7D7D]">
              Identifica al cliente y revisa el monto antes de confirmar. El servidor verifica la tarjeta,
              los permisos de sucursal y el límite diario configurado en el programa de sellos.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!user?.id}
          className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? "Guardado" : "Guardar Preferencias"}</span>
        </button>
      </form>
    </div>
  );
};
