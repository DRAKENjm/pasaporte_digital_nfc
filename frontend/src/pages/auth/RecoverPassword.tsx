import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import api from "../../services/api";

export const RecoverPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (token) {
      if (password.length < 8) {
        setMessage("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setMessage("Las contraseñas no coinciden.");
        return;
      }
    } else {
      if (!email.trim()) {
        setMessage("Ingresa tu correo electrónico.");
        return;
      }
    }

    setBusy(true);
    try {
      const { data } = await api.post(
        token ? "/auth/reset-password" : "/auth/recover",
        token ? { token, password } : { email: email.trim() },
      );
      setMessage(data.message || (token ? "Contraseña actualizada exitosamente." : "Instrucciones enviadas a tu correo."));
      setIsSuccess(true);
    } catch (e: any) {
      setMessage(
        e.response?.data?.message ||
          "No se pudo procesar la solicitud. Verifica los datos o intenta más tarde."
      );
      setIsSuccess(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-[#EFE7DE] p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
      {/* Encabezado */}
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#7C0A1E]/10 flex items-center justify-center text-[#7C0A1E] mb-3">
          {token ? <KeyRound className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#2D1A1E]">
          {token ? "Establecer Nueva Contraseña" : "Recuperación de Contraseña"}
        </h2>
        <p className="text-xs sm:text-sm text-[#8E7D7D] font-medium max-w-xs mx-auto">
          {token
            ? "Crea una nueva contraseña segura para acceder a tu pasaporte digital"
            : "Te enviaremos un enlace seguro a tu correo electrónico para restablecer tu acceso"}
        </p>
      </div>

      {/* Banner de Mensaje / Alerta */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn ${
            isSuccess
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {/* Formulario */}
      {(!isSuccess || token) ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {token ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#2D1A1E] uppercase tracking-wider mb-1.5">
                  Nueva contraseña *
                </label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-[#8E7D7D] absolute left-4 top-3.5 group-focus-within:text-[#7C0A1E] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    disabled={busy}
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-12 pr-12 py-3.5 bg-[#FAF8F5] border border-transparent rounded-2xl text-[14px] text-[#2D1A1E] font-semibold focus:bg-white focus:outline-none focus:border-[#7C0A1E] focus:ring-4 focus:ring-[#7C0A1E]/10 transition-all placeholder:text-[#8E7D7D]/70 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3.5 top-3.5 p-1 text-[#8E7D7D] hover:text-[#2D1A1E] transition-colors rounded-full"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D1A1E] uppercase tracking-wider mb-1.5">
                  Confirmar nueva contraseña *
                </label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-[#8E7D7D] absolute left-4 top-3.5 group-focus-within:text-[#7C0A1E] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    disabled={busy}
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#FAF8F5] border border-transparent rounded-2xl text-[14px] text-[#2D1A1E] font-semibold focus:bg-white focus:outline-none focus:border-[#7C0A1E] focus:ring-4 focus:ring-[#7C0A1E]/10 transition-all placeholder:text-[#8E7D7D]/70 disabled:opacity-50"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#2D1A1E] uppercase tracking-wider mb-1.5">
                Correo electrónico registrado *
              </label>
              <div className="relative group">
                <Mail className="w-5 h-5 text-[#8E7D7D] absolute left-4 top-3.5 group-focus-within:text-[#7C0A1E] transition-colors" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  disabled={busy}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#FAF8F5] border border-transparent rounded-2xl text-[14px] text-[#2D1A1E] font-semibold focus:bg-white focus:outline-none focus:border-[#7C0A1E] focus:ring-4 focus:ring-[#7C0A1E]/10 transition-all placeholder:text-[#8E7D7D]/70 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 mt-2 bg-[#7C0A1E] hover:bg-[#600616] text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-[#7C0A1E]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
          >
            {busy
              ? "Procesando solicitud..."
              : token
              ? "Guardar Nueva Contraseña"
              : "Enviar Enlace de Recuperación"}
          </button>
        </form>
      ) : (
        <div className="pt-2 text-center space-y-4">
          <div className="p-4 bg-[#FAF8F5] border border-[#E5DACD] rounded-2xl text-left space-y-2">
            <p className="text-xs text-[#2D1A1E] font-medium leading-relaxed">
              📩 Hemos enviado las instrucciones. Revisa tu bandeja de entrada o la carpeta de <strong>Spam / Correo no deseado</strong>.
            </p>
            <p className="text-[11.5px] text-[#8E7D7D] leading-relaxed">
              ¿No recibiste el correo? Nuestro equipo de administración ha recibido una alerta de seguridad de tu solicitud y podrá ayudarte a validar tu identidad y restaurar el acceso.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="w-full py-3.5 bg-[#7C0A1E] hover:bg-[#600616] text-white font-bold text-sm rounded-2xl shadow-md transition"
          >
            Regresar al Inicio de Sesión
          </button>
        </div>
      )}

      {/* Volver */}
      <div className="text-center pt-2 border-t border-[#EFE7DE]">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8E7D7D] hover:text-[#7C0A1E] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al Inicio de Sesión
        </Link>
      </div>
    </div>
  );
};
