import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { useUI } from "../../hooks/useUI";
import { homePathForRole } from "../../utils/roles";

export const Login: React.FC = () => {
  // 1. Animación de entrada Splash Screen
  const [showSplash, setShowSplash] = useState(true);
  const [splashFadeOut, setSplashFadeOut] = useState(false);

  // 2. Estados de autenticación por Usuario/Email y Contraseña
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem("remembered_identifier") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 3. Modal emergente de Notificaciones Push
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  // Temporizador para animación Splash inicial
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFadeOut(true);
    }, 1400);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      const hasPrompted = sessionStorage.getItem("notif_prompt_shown");
      if (!hasPrompted) {
        setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 500);
      }
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleAllowNotifications = () => {
    sessionStorage.setItem("notif_prompt_shown", "true");
    setShowNotificationPrompt(false);
    if ("Notification" in window) {
      Notification.requestPermission().catch(() => {});
    }
    showToast("Notificaciones habilitadas para sellos y recompensas", "success");
  };

  const handleDenyNotifications = () => {
    sessionStorage.setItem("notif_prompt_shown", "true");
    setShowNotificationPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast("Ingresa tu correo/usuario y contraseña", "info");
      return;
    }

    setLoading(true);
    try {
      const loggedUser: any = await login(identifier.trim(), password);
      localStorage.setItem("remembered_identifier", identifier.trim());
      navigate(homePathForRole(loggedUser?.role || "CLIENTE"));
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Credenciales incorrectas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setLoading(true);
    try {
      const loggedUser: any = await loginWithGoogle(credentialResponse.credential);
      navigate(homePathForRole(loggedUser?.role || "CLIENTE"));
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo iniciar sesión con Google", "error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* 1. ANIMACIÓN DE ENTRADA (SPLASH SCREEN) */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${
            splashFadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="relative mb-6 flex flex-col items-center">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl p-1 bg-white border-2 border-[#7C0A1E]/30 animate-pulse">
              <img
                src="/logo-icon.png"
                alt="Pasaporte Digital"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div className="mt-5">
              <div className="w-5 h-5 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#2D1A1E] tracking-tight">
            Pasaporte Digital
          </h2>
          <p className="text-xs text-[#8E7D7D] font-medium tracking-wide mt-1">
            Loading...
          </p>
        </div>
      )}

      {/* 2. PANTALLA PRINCIPAL: REGÍSTRATE O INICIA SESIÓN */}
      <div className="w-full max-w-sm mx-auto bg-white min-h-[85vh] flex flex-col justify-between p-6 sm:p-8 rounded-3xl shadow-sm border border-[#EFE7DE] relative animate-fadeIn">
        <div>
          {/* Logo y Título formal */}
          <div className="mb-6">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-[#EFE7DE] mb-4">
              <img
                src="/logo-icon.png"
                alt="Pasaporte Digital"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1A1E] tracking-tight leading-snug">
              Regístrate o inicia sesión
            </h1>
            <div className="w-12 h-1 bg-[#7C0A1E] rounded-full mt-2" />
            <p className="text-xs sm:text-sm text-[#736868] mt-2.5 leading-relaxed">
              Ingresa con tus credenciales o cuenta oficial para continuar
            </p>
          </div>

          {/* Formulario de Usuario / Correo y Contraseña */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider mb-1">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E7D7D] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="correo@ejemplo.com o usuario"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F8F6F4] border border-[#DDD6CE] rounded-2xl text-xs text-[#2D1A1E] font-medium focus:bg-white focus:outline-none focus:border-[#7C0A1E] transition disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#8E7D7D] uppercase tracking-wider">
                  Contraseña
                </label>
                <Link
                  to="/auth/recover"
                  className="text-[10px] text-[#7C0A1E] font-semibold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E7D7D] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F8F6F4] border border-[#DDD6CE] rounded-2xl text-xs text-[#2D1A1E] font-medium focus:bg-white focus:outline-none focus:border-[#7C0A1E] transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-2.5 p-0.5 text-[#8E7D7D] hover:text-[#2D1A1E] transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] hover:bg-[#600616] text-white font-bold text-sm rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {loading ? (
                "Verificando..."
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Separador con el círculo circular "o" */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-[#DDD6CE] w-full" />
            <div className="absolute bg-white px-3">
              <div className="w-8 h-8 rounded-xl bg-[#F8F6F4] border border-[#DDD6CE] flex items-center justify-center text-xs font-bold text-[#736868]">
                o
              </div>
            </div>
          </div>

          {/* Botón Continuar con Google */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => showToast("Error al conectar con Google", "error")}
              useOneTap={false}
              shape="pill"
              text="continue_with"
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </div>

        {/* Registro y Términos */}
        <div className="text-center pt-5">
          <p className="text-xs text-[#8E7D7D] mb-2">
            ¿No tienes cuenta?{" "}
            <Link
              to="/auth/register"
              className="font-bold text-[#7C0A1E] hover:underline"
            >
              Registrarse como cliente
            </Link>
          </p>
          <p className="text-[10px] text-[#8E7D7D] leading-relaxed">
            Al continuar, acepto los{" "}
            <Link to="/terminos" className="text-[#7C0A1E] font-medium hover:underline">
              Términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link to="/privacidad" className="text-[#7C0A1E] font-medium hover:underline">
              Política de privacidad
            </Link>
          </p>
        </div>

        {/* 3. MODAL BOTTOM SHEET DE NOTIFICACIONES PUSH */}
        {showNotificationPrompt && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#EFE7DE] text-center animate-slideUp">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-3.5">
                <Bell size={26} className="fill-sky-500 text-sky-500" />
              </div>

              <h3 className="text-base font-bold text-[#2D1A1E] mb-6 leading-snug px-2">
                ¿Permitir que Pasaporte Digital te envíe notificaciones?
              </h3>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAllowNotifications}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 text-[#2D1A1E] font-bold text-sm transition border border-[#EFE7DE]"
                >
                  Permitir
                </button>

                <button
                  type="button"
                  onClick={handleDenyNotifications}
                  className="w-full py-2.5 rounded-2xl text-[#2D1A1E] font-bold text-sm transition hover:bg-slate-50"
                >
                  No permitir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
