import { LegalLink } from "../../components/common/LegalLink";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, UserPlus, ShieldCheck, CreditCard, Wifi, CheckCircle2, QrCode } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { useNFCReader } from "../../hooks/useNFCReader";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";

export const Register: React.FC = () => {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
  });
  const [tieneTarjetaFisica, setTieneTarjetaFisica] = useState(false);
  const [uidNfc, setUidNfc] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const {
    isScanning,
    isSupported: isNfcSupported,
    error: nfcError,
    startScan,
    stopScan,
  } = useNFCReader();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStartScanNfc = () => {
    if (isScanning) {
      stopScan();
      return;
    }
    void startScan((result) => {
      if (result.serialNumber) {
        setUidNfc(result.serialNumber);
        showToast("¡Tarjeta NFC detectada correctamente!", "success");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    stopScan();

    if (!uidNfc.trim()) {
      showToast("Debes escanear o ingresar el código de tu tarjeta física NFC para registrarte", "error");
      return;
    }

    setLoading(true);
    try {
      await register({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        password: form.password,
        uid_nfc: uidNfc.trim(),
      });

      showToast(
        "¡Pasaporte y Tarjeta NFC vinculados con éxito! Inicia sesión para continuar.",
        "success",
      );
      navigate("/auth/login");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al registrarse", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#EFE7DE] p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Registro de Pasaporte Digital
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Vincula tu tarjeta física oficial y comienza a coleccionar sellos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nombres *"
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
            required
            placeholder="Ej. Juan"
          />
          <Input
            label="Apellidos *"
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            required
            placeholder="Ej. Pérez"
          />
        </div>

        <Input
          label="Correo Electrónico *"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="ejemplo@correo.com"
        />

        <Input
          label="Contraseña *"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          isPassword
          placeholder="Mínimo 8 caracteres"
        />

        {/* Sección Obligatoria: Tarjeta NFC Física */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border-2 border-[#7C0A1E]/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C0A1E]/10 flex items-center justify-center text-[#7C0A1E] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-[#2D1A1E]">Tarjeta Física NFC Oficial</p>
                <span className="text-[10px] bg-[#7C0A1E] text-white px-2 py-0.5 rounded-full font-bold">
                  Obligatorio
                </span>
              </div>
              <p className="text-[11px] text-[#8E7D7D]">Acerca tu tarjeta física o ingresa su código / UID</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {isNfcSupported && (
              <button
                type="button"
                onClick={handleStartScanNfc}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                  isScanning
                    ? "bg-amber-600 text-white animate-pulse"
                    : "bg-[#7C0A1E] text-white hover:bg-[#600616]"
                }`}
              >
                <Wifi size={14} className="rotate-90" />
                <span>
                  {isScanning
                    ? "📱 Acerca la tarjeta a la parte trasera del teléfono (Click para cancelar)"
                    : "📱 Acercar tarjeta física al teléfono (NFC)"}
                </span>
              </button>
            )}
            {nfcError && <p className="text-xs text-[#7C0A1E] font-medium">{nfcError}</p>}

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#736868] flex items-center justify-between">
                <span>UID o Código impreso en tu tarjeta *</span>
                {uidNfc && (
                  <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Detectado
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 04:A1:B2:C3:D4 o NFC-1002"
                value={uidNfc}
                onChange={(e) => setUidNfc(e.target.value)}
                className="input-base font-mono text-xs w-full bg-white border border-[#EFE7DE] focus:border-[#7C0A1E]"
              />
            </div>

            <p className="text-[11px] text-[#8E7D7D] bg-white/80 p-2.5 rounded-xl border border-[#EFE7DE] leading-relaxed">
              💡 <strong>¿Aún no tienes tarjeta física?</strong> Adquiérela en cualquiera de los locales afiliados para activar tu Pasaporte Digital y empezar a registrar sellos.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-tight">
          Al registrarse, declara aceptar los <LegalLink type="TERMINOS_CONDICIONES">términos del servicio</LegalLink> y la <LegalLink type="POLITICA_PRIVACIDAD">política de privacidad</LegalLink>.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#7C0A1E] hover:bg-[#600616] disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
        >
          {loading ? (
            "Validando y creando pasaporte..."
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Validar Tarjeta y Crear Cuenta
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ¿Ya tiene una cuenta registrada?{" "}
          <Link
            to="/auth/login"
            className="font-bold text-[#7C0A1E] hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
