import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Wifi, Award, Info, CheckCircle2, QrCode, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

function frameColorForLevel(nivel?: string) {
  const n = (nivel || "").toLowerCase();
  if (n.includes("maestro") || n.includes("oro") || n.includes("gold")) return "#C5A059";
  if (n.includes("explorador") || n.includes("plata") || n.includes("silver")) return "#A8A9AD";
  if (n.includes("socio") || n.includes("vip")) return "#7C0A1E";
  return "#7C0A1E"; // Iniciador / default vino
}

export const PasaporteNfcPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [escaneando, setEscaneando] = useState(false);
  const [exito, setExito] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [vista, setVista] = useState<"tarjeta" | "escanear">("tarjeta");
  const [imagenFondo, setImagenFondo] = useState<string | null>(null);
  const [tarjetaInfo, setTarjetaInfo] = useState<any>(null);
  const [nivelNombre, setNivelNombre] = useState("Iniciador");
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prof, pers] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/nfc/tarjeta/personalizacion").catch(() => null),
        ]);
        const data = prof.data?.data;
        setTarjetaInfo(data?.tarjeta_activa || null);
        setNivelNombre(data?.nivel?.nombre || "Iniciador");
        const img =
          pers?.data?.data?.imagen_fondo ||
          data?.tarjeta_personalizacion?.imagen_fondo ||
          null;
        if (img) setImagenFondo(img);
      } catch {
        /* ignore */
      }
    };
    load();
  }, []);

  const handleImagen = async (file: File) => {
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", "tarjeta_nfc");
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setImagenFondo(url);
        await api.patch("/nfc/tarjeta/personalizacion", { imagen_fondo: url });
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la personalización. Verifica media upload y el endpoint NFC.");
    } finally {
      setGuardando(false);
    }
  };

  const simularLecturaNfc = async () => {
    setEscaneando(true);
    setMensaje("Leyendo chip NFC...");
    setTimeout(async () => {
      setMensaje("Validando con terminal...");
      try {
        const idRes = await api.post("/nfc/identificar", {
          uid_nfc: "04:A1:B2:C3:D4:E5:1234",
        });
        await api.post("/nfc/confirmar-visita", {
          id_tarjeta: idRes.data.data.id_tarjeta,
          id_sucursal: 1,
          observacion: "Lectura desde Pasaporte Web",
        });
        setExito(true);
        setMensaje("¡Visita registrada!");
      } catch (err: any) {
        setExito(false);
        setMensaje(err.response?.data?.message || "Lectura completada");
      } finally {
        setEscaneando(false);
      }
    }, 1500);
  };

  const codigo = tarjetaInfo?.codigo_interno || "NFC-2025-0001";
  const nombre = user?.nombres || "Usuario";
  const marco = frameColorForLevel(nivelNombre);

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col p-4 sm:p-5 pb-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2 mb-4">
        <button
          onClick={() => (vista === "escanear" ? setVista("tarjeta") : navigate(-1))}
          className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-[#2D1A1E]">
          {vista === "tarjeta" ? "Mi Tarjeta NFC" : "Registrar visita"}
        </h1>
        <div className="flex items-center space-x-1 bg-[#7C0A1E] text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
          <Wifi size={13} className="rotate-90" />
          <span>NFC</span>
        </div>
      </div>

      {vista === "tarjeta" ? (
        <>
          <div
            className="relative w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl"
            style={{ border: `3px solid ${marco}`, boxShadow: `0 8px 24px ${marco}40` }}
          >
            {imagenFondo ? (
              <img src={imagenFondo} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C0A1E] via-[#9B1B30] to-[#580614]" />
            )}
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative h-full flex flex-col justify-between p-4 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Pasaporte Digital</p>
                  <p className="text-sm font-bold mt-0.5">{nombre}</p>
                  <span
                    className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: marco, color: "#fff" }}
                  >
                    {nivelNombre}
                  </span>
                </div>
                <Wifi size={22} className="rotate-90 opacity-90" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] opacity-70">Código</p>
                  <p className="font-mono text-sm tracking-wider">{codigo}</p>
                </div>
                <div className="w-14 h-14 bg-white/90 rounded-lg flex items-center justify-center">
                  <QrCode size={32} className="text-[#7C0A1E]" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-[#8E7D7D] my-4 px-2">
            El marco cambia según tu nivel. Sube una imagen; se guarda en tu cuenta.
          </p>

          <div className="space-y-2.5 max-w-sm mx-auto w-full">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImagen(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={guardando}
              className="w-full py-3 rounded-2xl border border-dashed border-[#C5A059] bg-white text-[#7C0A1E] text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {guardando ? "Guardando..." : imagenFondo ? "Cambiar imagen (se guarda)" : "Agregar imagen de fondo"}
            </button>
            <button
              onClick={() => setVista("escanear")}
              className="w-full py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Wifi size={16} className="rotate-90" />
              Registrar visita con NFC
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center flex-1 justify-center">
          <div className="relative w-40 h-40 mb-6">
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-[#C5A059] ${escaneando ? "animate-pulse" : ""}`} />
            <div className="absolute inset-4 rounded-full bg-[#7C0A1E] flex items-center justify-center text-white shadow-lg">
              <Wifi size={48} className="rotate-90" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#2D1A1E]">Acerca tu tarjeta NFC</h2>
          <button
            onClick={simularLecturaNfc}
            disabled={escaneando}
            className="mt-6 w-full max-w-xs py-3.5 rounded-2xl bg-[#7C0A1E] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            {escaneando ? mensaje : exito ? (
              <><CheckCircle2 size={16} /> ¡Registrado!</>
            ) : (
              <><Wifi size={16} className="rotate-90" /> Simular NFC</>
            )}
          </button>
          <div className="bg-[#F5EFEB] rounded-2xl p-3.5 flex items-start gap-2 border border-[#EFE7DE] mt-6 max-w-xs w-full">
            <Info size={16} className="text-[#7C0A1E] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#8E7D7D]">Mantén la tarjeta cerca del lector del local.</p>
          </div>
        </div>
      )}
    </div>
  );
};
