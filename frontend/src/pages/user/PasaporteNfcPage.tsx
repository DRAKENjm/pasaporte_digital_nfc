import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Wifi, Award, Info, CheckCircle2, QrCode, Upload, Eye, X, Copy, Check, CreditCard, Store, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

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
  const { t } = useLanguage();
  const [escaneando, setEscaneando] = useState(false);
  const [exito, setExito] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [vista, setVista] = useState<"tarjeta" | "escanear">("tarjeta");
  const [imagenFondo, setImagenFondo] = useState<string | null>(null);
  const [tarjetaInfo, setTarjetaInfo] = useState<any>(null);
  const [nivelNombre, setNivelNombre] = useState("Iniciador");
  const [guardando, setGuardando] = useState(false);
  
  // Modal QR de Respaldo
  const [mostrarModalQr, setMostrarModalQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiado, setCopiado] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prof, pers] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/nfc/tarjeta/personalizacion").catch(() => null),
        ]);
        const data = prof.data?.data;
        const tarjeta = data?.tarjeta_activa || null;
        setTarjetaInfo(tarjeta);
        setNivelNombre(data?.nivel?.nombre || "Iniciador");
        const img =
          pers?.data?.data?.imagen_fondo ||
          data?.tarjeta_personalizacion?.imagen_fondo ||
          null;
        if (img) setImagenFondo(img);

        // Generar QR de respaldo usando el código de respaldo, código interno o código cliente
        const valorQr = tarjeta?.qr_respaldo || tarjeta?.codigo_interno || data?.codigo_cliente || `CLI-${data?.id || user?.id}`;
        try {
          const url = await QRCode.toDataURL(valorQr, {
            width: 280,
            margin: 2,
            color: {
              dark: "#2D1A1E",
              light: "#FFFFFF",
            },
          });
          setQrDataUrl(url);
        } catch (err) {
          console.error("Error generando código QR:", err);
        }
      } catch {
        /* ignore */
      }
    };
    load();
  }, [user?.id]);

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
        const uid = tarjetaInfo?.uid_nfc || "04:A1:B2:C3:D4:E5:1234";
        const idRes = await api.post("/nfc/identificar", {
          uid_nfc: uid,
        });
        setExito(true);
        setMensaje(`¡Identificado como ${idRes.data?.data?.cliente?.nombres || "Cliente"}!`);
      } catch (err: any) {
        setExito(false);
        setMensaje(err.response?.data?.message || "Lectura completada");
      } finally {
        setEscaneando(false);
      }
    }, 1200);
  };

  const codigo = tarjetaInfo?.codigo_interno || user?.codigo_cliente || "NFC-2025-0001";
  const qrRespaldoTexto = tarjetaInfo?.qr_respaldo || tarjetaInfo?.codigo_interno || user?.codigo_cliente || codigo;
  const nombre = user?.nombres ? `${user.nombres} ${user?.apellidos || ""}`.trim() : "Usuario Pasaporte";
  const marco = frameColorForLevel(nivelNombre);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(qrRespaldoTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] flex flex-col p-4 sm:p-5 pb-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between pt-2 mb-4">
        <button
          onClick={() => (vista === "escanear" ? setVista("tarjeta") : navigate(-1))}
          className="w-9 h-9 rounded-full bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E]"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-[#2D1A1E]">
          {vista === "tarjeta" ? (t("myCard") || "Mi Tarjeta NFC") : "Validar NFC"}
        </h1>
        <div className="flex items-center space-x-1 bg-[#7C0A1E] text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
          <Wifi size={13} className="rotate-90" />
          <span>NFC + QR</span>
        </div>
      </div>

      {vista === "tarjeta" ? (
        <>
          {/* CASO 1: SIN TARJETA ASIGNADA TODAVÍA */}
          {!tarjetaInfo || !tarjetaInfo.uid_nfc ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-sm text-center space-y-5 animate-fadeIn max-w-sm mx-auto w-full">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#C5A059] animate-pulse opacity-60" />
                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-[#C5A059]/30 text-[#7C0A1E] flex items-center justify-center shadow-inner">
                  <CreditCard size={36} className="text-[#C5A059]" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7C0A1E] bg-[#7C0A1E]/10 px-3 py-1 rounded-full">
                  Sin Tarjeta Vinculada
                </span>
                <h2 className="text-lg font-bold text-[#2D1A1E]">
                  Aún no cuentas con una tarjeta física NFC
                </h2>
                <p className="text-xs text-[#8E7D7D] leading-relaxed">
                  Solicita tu tarjeta física en cualquier local afiliado para vincularla a tu cuenta y empezar a sellar.
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/user/locales")}
                  className="w-full py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#600616] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Store size={16} />
                  <span>Ver Locales Afiliados</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/home")}
                  className="w-full py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#8E7D7D] hover:text-[#2D1A1E]"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          ) : tarjetaInfo.estado === "BLOQUEADA" || tarjetaInfo.estado === "PERDIDA" ? (
            /* CASO 2: TARJETA BLOQUEADA O EXTRAVIADA */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm text-center space-y-5 animate-fadeIn max-w-sm mx-auto w-full">
              <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert size={38} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                  Tarjeta Inhabilitada ({tarjetaInfo.estado})
                </span>
                <h2 className="text-lg font-bold text-[#2D1A1E]">
                  Tu tarjeta física NFC está inhabilitada
                </h2>
                <p className="text-xs text-[#8E7D7D] leading-relaxed">
                  Esta credencial se encuentra suspendida temporalmente por seguridad.
                  {tarjetaInfo.motivo_bloqueo && (
                    <span className="block mt-1.5 font-medium text-rose-800 bg-rose-50 p-2 rounded-xl border border-rose-100">
                      Motivo: {tarjetaInfo.motivo_bloqueo}
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/user/locales")}
                  className="w-full py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#600616] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Store size={16} />
                  <span>Solicitar Reemplazo en un Local</span>
                </button>
              </div>
            </div>
          ) : (
            /* CASO 3: TARJETA ASIGNADA Y ACTIVA */
            <>
              {/* Tarjeta Digital */}
              <div
                onClick={() => setMostrarModalQr(true)}
                className="relative w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl cursor-pointer group transition-transform active:scale-[0.99]"
                style={{ border: `3px solid ${marco}`, boxShadow: `0 8px 24px ${marco}40` }}
                title="Toca para ampliar el QR de Respaldo"
              >
                {imagenFondo ? (
                  <img src={imagenFondo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7C0A1E] via-[#9B1B30] to-[#580614]" />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
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
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2 py-1 rounded-lg">
                      <Wifi size={16} className="rotate-90 opacity-90" />
                      <span className="text-[10px] font-mono font-bold tracking-wider">NFC</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] opacity-70">Código / Respaldo</p>
                      <p className="font-mono text-sm tracking-wider font-bold">{codigo}</p>
                    </div>

                    {/* Minicuadro QR interactivo */}
                    <div className="w-14 h-14 bg-white rounded-lg p-1 flex items-center justify-center shadow-md">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR de respaldo" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode size={30} className="text-[#7C0A1E]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón directo para Ver QR de Respaldo */}
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => setMostrarModalQr(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EFE7DE] shadow-xs text-xs font-bold text-[#7C0A1E] hover:bg-[#FAF8F5]"
                >
                  <QrCode size={16} className="text-[#C5A059]" />
                  <span>Ver QR de Respaldo en pantalla completa</span>
                </button>
              </div>

              <p className="text-center text-xs text-[#8E7D7D] my-3 px-2">
                Presenta este QR en el local si no tienes tu tarjeta NFC física a la mano.
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
                  className="w-full py-3 rounded-2xl border border-dashed border-[#C5A059] bg-white text-[#7C0A1E] text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50/40 transition-colors"
                >
                  <Upload size={16} />
                  {guardando ? "Guardando..." : imagenFondo ? "Cambiar foto de fondo" : "Personalizar fondo de tarjeta"}
                </button>

                <button
                  onClick={() => setVista("escanear")}
                  className="w-full py-3.5 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#600616] transition-colors"
                >
                  <Wifi size={16} className="rotate-90" />
                  Probar lectura de chip NFC
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center flex-1 justify-center">
          <div className="relative w-40 h-40 mb-6">
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-[#C5A059] ${escaneando ? "animate-pulse" : ""}`} />
            <div className="absolute inset-4 rounded-full bg-[#7C0A1E] flex items-center justify-center text-white shadow-lg">
              <Wifi size={48} className="rotate-90" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#2D1A1E]">Terminal de prueba NFC</h2>
          <p className="text-xs text-[#8E7D7D] mt-1 text-center max-w-xs">
            Comprueba que tu credencial digital esté correctamente vinculada al sistema.
          </p>
          <button
            onClick={simularLecturaNfc}
            disabled={escaneando}
            className="mt-6 w-full max-w-xs py-3.5 rounded-2xl bg-[#7C0A1E] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            {escaneando ? mensaje : exito ? (
              <><CheckCircle2 size={16} /> {mensaje || "¡Registrado!"}</>
            ) : (
              <><Wifi size={16} className="rotate-90" /> Probar Identificación</>
            )}
          </button>
          <div className="bg-[#F5EFEB] rounded-2xl p-3.5 flex items-start gap-2 border border-[#EFE7DE] mt-6 max-w-xs w-full">
            <Info size={16} className="text-[#7C0A1E] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#8E7D7D]">
              En los locales también puedes validar presentando tu <strong>código QR de respaldo</strong> en caso de no contar con el chip físico.
            </p>
          </div>
        </div>
      )}

      {/* Modal QR de Respaldo */}
      {mostrarModalQr && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative border border-[#EFE7DE]">
            <button
              onClick={() => setMostrarModalQr(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] bg-amber-50 px-3 py-1 rounded-full border border-[#C5A059]/30">
                RESPALDO DIGITAL
              </span>
              <h3 className="text-lg font-black text-[#2D1A1E] mt-2">
                Tu Código QR de Pasaporte
              </h3>
              <p className="text-xs text-[#8E7D7D] mt-0.5">
                Presenta este código en caja para registrar tu visita y recibir tus sellos.
              </p>
            </div>

            {/* Código QR renderizado en grande */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#7C0A1E]/30 flex flex-col items-center justify-center shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Pasaporte" className="w-56 h-56 object-contain" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <QrCode size={64} className="text-[#7C0A1E] animate-pulse" />
                </div>
              )}
            </div>

            {/* Código en texto y botón copiar */}
            <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-xl p-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#8E7D7D] block uppercase">Código de Respaldo</span>
                <span className="font-mono text-sm font-black text-[#7C0A1E]">{qrRespaldoTexto}</span>
              </div>
              <button
                onClick={copiarCodigo}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#EFE7DE] text-xs font-bold text-[#2D1A1E] flex items-center gap-1.5 hover:bg-slate-50"
              >
                {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiado ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            <button
              onClick={() => setMostrarModalQr(false)}
              className="w-full py-3 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#600616]"
            >
              Listo, cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

