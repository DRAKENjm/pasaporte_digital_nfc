import React, { useState } from "react";
import { Settings, Volume2, Wifi, Save, CheckCircle2, ShieldCheck, Laptop } from "lucide-react";
import { useUI } from "../../hooks/useUI";

export const CommerceConfiguracion: React.FC = () => {
  const [sonidoLectura, setSonidoLectura] = useState(true);
  const [modoLector, setModoLector] = useState("USB_NFC");
  const [autoConfirmar, setAutoConfirmar] = useState(false);
  const [saved, setSaved] = useState(false);
  const { showToast } = useUI();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showToast("Preferencias de terminal guardadas", "success");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Configuración de Terminal</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Parámetros de lectura NFC, hardware USB y alertas de mostrador
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
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1 uppercase">
                Modo del Sensor
              </label>
              <select
                value={modoLector}
                onChange={(e) => setModoLector(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              >
                <option value="USB_NFC">Lector NFC USB (ACR122U / Estándar)</option>
                <option value="WEB_NFC">Web NFC API (Nativo de navegador)</option>
                <option value="MANUAL">Ingreso Manual / Teclado</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1 uppercase">
                Alerta Sonora al Validar
              </label>
              <button
                type="button"
                onClick={() => setSonidoLectura(!sonidoLectura)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  sonidoLectura
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-[#FAF8F5] border-[#EFE7DE] text-[#8E7D7D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Volume2 size={16} />
                  {sonidoLectura ? "Sonido Activado" : "Silenciado"}
                </span>
                <span className="text-[10px] uppercase font-bold">{sonidoLectura ? "ON" : "OFF"}</span>
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
            <p className="font-bold text-[#2D1A1E]">✓ Intervalo Mínimo entre Lecturas: 60 minutos</p>
            <p className="text-[11px] text-[#8E7D7D]">
              Evita que se registre dos veces la misma tarjeta en una misma sesión de compra.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? "Guardado" : "Guardar Preferencias"}</span>
        </button>
      </form>
    </div>
  );
};
