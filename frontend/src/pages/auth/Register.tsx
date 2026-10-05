import { LegalLink } from "../../components/common/LegalLink";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, UserPlus, ShieldCheck, CreditCard, Wifi, CheckCircle2, QrCode, Sparkles, Gift } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { useNFCReader } from "../../hooks/useNFCReader";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refCode = (searchParams.get("ref") || "").trim().toUpperCase();

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
  });
  const [tieneTarjetaFisica, setTieneTarjetaFisica] = useState(false);
  const [uidNfc, setUidNfc] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState(refCode);
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
        uid_nfc: tieneTarjetaFisica && uidNfc.trim() ? uidNfc.trim() : undefined,
        codigo_invitacion: codigoInvitacion.trim() || undefined,
      });

      showToast(
        codigoInvitacion.trim()
          ? "¡Cuenta creada y +50 puntos de bienvenida acreditados! Inicia sesión."
          : "¡Cuenta creada exitosamente! Inicia sesión para comenzar.",
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
          Registro en Pasaporte Digital
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Crea tu cuenta, acumula puntos y colecciona sellos en tus locales favoritos
        </p>
      </div>

      {refCode && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border border-[#C5A059]/40 flex items-center gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/20 text-[#7C0A1E] flex items-center justify-center font-black shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#7C0A1E]">
              ¡Invitación activa de un amigo! <span className="font-mono font-black">{refCode}</span>
            </p>
            <p className="text-[11px] text-[#8E7D7D]">
              Al registrarte recibirás <strong>+50 Puntos de bienvenida</strong> de regalo.
            </p>
          </div>
        </div>
      )}

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
          minLength={6}
          maxLength={72}
          autoComplete="new-password"
          isPassword
          placeholder="Mínimo 6 caracteres"
        />

        {/* Campo Código de Invitación si no vino por URL */}
        {!refCode && (
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-[#736868]">
              ¿Tienes un código de invitación de un amigo? (Opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. AMIGO-123456"
                value={codigoInvitacion}
                onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
                className="input-base font-mono text-xs w-full bg-[#FAF8F5] border border-[#EFE7DE] focus:border-[#7C0A1E] uppercase"
              />
            </div>
            <p className="text-[10px] text-[#8E7D7D]">
              Ingresa el código para recibir +50 puntos de bienvenida.
            </p>
          </div>
        )}

        {/* Sección Opcional: Tarjeta NFC Física */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7C0A1E]/10 flex items-center justify-center text-[#7C0A1E] shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2D1A1E]">¿Ya tienes una tarjeta física NFC?</p>
                <p className="text-[11px] text-[#8E7D7D]">Puedes vincularla ahora o solicitarla después en un local</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTieneTarjetaFisica(!tieneTarjetaFisica)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                tieneTarjetaFisica
                  ? "bg-[#7C0A1E] text-white"
                  : "bg-white border border-[#D9D0C7] text-[#5A4B4B] hover:bg-slate-50"
              }`}
            >
              {tieneTarjetaFisica ? "Vincular chip" : "Opcional"}
            </button>
          </div>

          {tieneTarjetaFisica && (
            <div className="space-y-2.5 pt-2 border-t border-[#EFE7DE] animate-fadeIn">
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
                      ? "📱 Acerca la tarjeta a la parte trasera del teléfono"
                      : "📱 Acercar tarjeta al lector NFC del teléfono"}
                  </span>
                </button>
              )}
              {nfcError && <p className="text-xs text-[#7C0A1E] font-medium">{nfcError}</p>}

              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#736868] flex items-center justify-between">
                  <span>UID o Código de la tarjeta</span>
                  {uidNfc && (
                    <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Detectado
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Ej: 04:A1:B2:C3:D4 o NFC-1002"
                  value={uidNfc}
                  onChange={(e) => setUidNfc(e.target.value)}
                  className="input-base font-mono text-xs w-full bg-white border border-[#EFE7DE] focus:border-[#7C0A1E]"
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500 leading-tight">
          Al registrarse, declara aceptar los <LegalLink type="TERMINOS_CONDICIONES">términos del servicio</LegalLink> y la <LegalLink type="POLITICA_PRIVACIDAD">política de privacidad</LegalLink>.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#7C0A1E] hover:bg-[#600616] disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
        >
          {loading ? (
            "Creando cuenta..."
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Crear Cuenta
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
