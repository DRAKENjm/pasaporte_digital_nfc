import React, { useState } from "react";
import { ArrowLeft, Wifi, Award, Info, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export const PasaporteNfcPage: React.FC = () => {
  const navigate = useNavigate();
  const [escaneando, setEscaneando] = useState(false);
  const [exito, setExito] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Simulación interactiva de acercamiento de tarjeta NFC
  const simularLecturaNfc = async () => {
    setEscaneando(true);
    setMensaje("Leyendo chip NFC...");
    try {
      setTimeout(async () => {
        setMensaje("Validando con terminal...");
        try {
          // Identificar tarjeta NFC demo
          const idRes = await api.post("/nfc/identificar", {
            uid_nfc: "04:A1:B2:C3:D4:E5:1234",
          });

          // Confirmar visita simulada en local 1
          await api.post("/nfc/confirmar-visita", {
            id_tarjeta: idRes.data.data.id_tarjeta,
            id_sucursal: 1,
            observacion: "Lectura presencial desde Pasaporte Web",
          });

          setExito(true);
          setMensaje("¡Visita registrada y +20 puntos acreditados!");
        } catch (err: any) {
          setExito(false);
          setMensaje(err.response?.data?.message || "Lectura completada (Tarjeta identificada)");
        } finally {
          setEscaneando(false);
        }
      }, 1800);
    } catch (e) {
      setEscaneando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-6">
      {/* Header superior */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E]"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-[#2D1A1E]">Registrar visita</h1>
        <div className="flex items-center space-x-1 bg-[#7C0A1E] text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
          <Wifi size={13} className="rotate-90" />
          <span>NFC</span>
        </div>
      </div>

      {/* Ilustración central del Lector NFC y Pasaporte Físico (como en mockup 3) */}
      <div className="my-auto flex flex-col items-center justify-center text-center px-4">
        {/* Gráfico representativo del dispositivo NFC y tarjeta borgoña */}
        <div className="relative w-64 h-56 flex items-center justify-center mb-6">
          {/* Lector blanco */}
          <div className="w-44 h-48 bg-white rounded-3xl shadow-xl border border-[#EFE7DE] flex flex-col items-center justify-center relative p-4">
            {/* Anillos de ondas NFC animadas */}
            <div className={`absolute w-36 h-36 rounded-full border-2 border-[#C5A059]/30 ${escaneando ? "animate-ping" : ""}`} />
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center text-[#7C0A1E] mb-2 shadow-inner">
              <Wifi size={24} className="rotate-90" />
            </div>
            <span className="text-[10px] text-[#8E7D7D] font-semibold tracking-wider uppercase">Lector NFC</span>
          </div>

          {/* Tarjeta física borgoña inclinada superpuesta */}
          <div
            onClick={simularLecturaNfc}
            className="cursor-pointer absolute right-2 top-4 w-32 h-44 bg-gradient-to-br from-[#7C0A1E] to-[#4A040F] rounded-2xl shadow-2xl p-3 border border-[#C5A059]/50 flex flex-col justify-between transform rotate-6 hover:rotate-3 transition-transform text-white"
          >
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold tracking-wider text-[#E8D3A2]">PASAPORTE</span>
              <Wifi size={12} className="text-[#E8D3A2] rotate-90" />
            </div>
            <div className="text-center my-auto">
              <div className="text-[18px]">🏛️</div>
              <span className="text-[9px] font-bold text-[#FAF8F5] block mt-1">DIGITAL</span>
            </div>
            <div className="text-[7px] text-[#E8D3A2]/80 font-mono tracking-widest">
              **** 1234
            </div>
          </div>
        </div>

        {/* Título de acción */}
        <h2 className="text-xl font-bold text-[#2D1A1E]">
          Acerca tu tarjeta NFC
        </h2>
        <p className="text-xs text-[#8E7D7D] mt-1.5 max-w-xs">
          Para registrar tu visita presencial y ganar sellos y puntos en este establecimiento.
        </p>

        {/* Botón de acción / simulación interactiva */}
        <button
          onClick={simularLecturaNfc}
          disabled={escaneando}
          className="mt-6 w-full max-w-xs py-3.5 px-6 rounded-2xl bg-[#7C0A1E] text-white font-bold text-xs shadow-md hover:bg-[#580614] active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          {escaneando ? (
            <span>{mensaje}</span>
          ) : exito ? (
            <>
              <CheckCircle2 size={16} className="text-[#E8D3A2]" />
              <span>¡Visita y puntos registrados!</span>
            </>
          ) : (
            <>
              <Wifi size={16} className="rotate-90" />
              <span>Simular aproximación NFC</span>
            </>
          )}
        </button>

        {/* Card informativo de Sello a registrar */}
        <div className="w-full max-w-xs bg-white border border-[#EFE7DE] rounded-2xl p-3 mt-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C5A059]/20 text-[#7C0A1E] flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[#8E7D7D] block">Sello a registrar</span>
              <span className="text-xs font-bold text-[#7C0A1E]">+20 puntos</span>
            </div>
          </div>
          <span className="text-xs text-[#C5A059] font-bold">Aroma Café</span>
        </div>
      </div>

      {/* Footer informativo */}
      <div className="bg-[#F5EFEB] rounded-2xl p-3.5 flex items-start space-x-2.5 text-left border border-[#EFE7DE]">
        <Info size={16} className="text-[#7C0A1E] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#8E7D7D] leading-relaxed">
          Mantén tu tarjeta cerca del lector del establecimiento hasta que el trabajador confirme el registro de la visita.
        </p>
      </div>
    </div>
  );
};
