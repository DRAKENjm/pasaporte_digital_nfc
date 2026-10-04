import { LegalLink } from "../../components/common/LegalLink";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { useUI } from "../../hooks/useUI";
import { homePathForRole } from "../../utils/roles";

export const Login: React.FC = () => {
  // 2. Estados de autenticación por Usuario/Email y Contraseña
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem("remembered_identifier") || "";
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem("remembered_password") || "";
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem("remembered_identifier"));
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("inactivity") === "1") {
      setErrorMsg("Tu sesión se cerró por inactividad.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!identifier.trim() || !password) {
      setErrorMsg("Ingresa tu correo y contraseña");
      return;
    }

    setLoading(true);
    try {
      const loggedUser: any = await login(identifier.trim(), password);
      if (rememberMe) {
        localStorage.setItem("remembered_identifier", identifier.trim());
        localStorage.setItem("remembered_password", password);
      } else {
        localStorage.removeItem("remembered_identifier");
        localStorage.removeItem("remembered_password");
      }
      navigate(homePathForRole(loggedUser?.role || "CLIENTE"));
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const loggedUser: any = await loginWithGoogle(credentialResponse.credential);
      navigate(homePathForRole(loggedUser?.role || "CLIENTE"));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "No se pudo iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen sm:min-h-[auto] bg-white sm:bg-transparent flex flex-col sm:rounded-[32px] sm:shadow-xl sm:border border-[#EFE7DE] overflow-hidden relative animate-fadeIn mx-auto sm:max-w-[400px]">
      {/* Header Color Block */}
      <div className="relative w-full pt-20 pb-16 px-10 bg-gradient-to-br from-[#7C0A1E] to-[#5a0513] flex flex-col justify-center">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M45.7,-76.1C58.9,-69.3,69.1,-55.4,75.9,-40.5C82.8,-25.6,86.2,-9.7,84.4,5.4C82.5,20.5,75.4,34.8,65.3,46.1C55.2,57.4,42,65.6,27.8,70.6C13.6,75.5,-1.7,77.1,-16.4,74.9C-31,72.6,-45.1,66.6,-56.9,56.7C-68.7,46.8,-78.2,33.1,-82.9,17.7C-87.5,2.4,-87.3,-14.5,-80.6,-28.9C-73.8,-43.3,-60.5,-55.1,-46.2,-61.6C-31.9,-68.2,-16,-69.5,0.7,-70.6C17.3,-71.7,32.6,-82.9,45.7,-76.1Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute top-10 -left-10 opacity-5 pointer-events-none">
          <svg width="150" height="150" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M38.1,-63.9C51.6,-55.5,66.3,-48.6,75.6,-36.8C84.9,-25,88.8,-8.3,86.5,7.6C84.3,23.5,75.9,38.6,64.2,49.8C52.4,61,37.3,68.2,21.5,71.5C5.7,74.8,-10.7,74.2,-25.3,69.2C-39.8,64.3,-52.4,55,-61.7,42.7C-71,30.4,-77,15.2,-78.5,-0.9C-80,-17,-77,-34,-67.7,-46.1C-58.4,-58.3,-42.8,-65.7,-28.5,-69C-14.2,-72.3,0,-71.4,14.6,-69.6C29.2,-67.8,45,-65.1,38.1,-63.9Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 leading-none">
            ¡Hola de nuevo!
          </h1>
          <p className="text-[#EFE7DE] text-[15px] font-medium">
            Nos alegra tenerte de vuelta.
          </p>
        </div>
      </div>

      {/* Form Box overlapping the header */}
      <div className="flex-1 bg-white px-8 sm:px-10 pt-10 pb-10 rounded-t-[32px] -mt-8 relative z-20 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 items-start animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[14px] font-semibold text-red-800 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative group">
              <Mail className="w-5 h-5 text-[#8E7D7D] absolute left-4 top-4 group-focus-within:text-[#7C0A1E] transition-colors" />
              <input
                type="email"
                autoComplete="username"
                required
                disabled={loading}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full pl-12 pr-4 py-4 bg-[#FAF8F5] border border-transparent rounded-2xl text-[14px] text-[#2D1A1E] font-semibold focus:bg-white focus:outline-none focus:border-[#7C0A1E] focus:ring-4 focus:ring-[#7C0A1E]/10 transition-all placeholder:text-[#8E7D7D]/70 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="relative group">
              <Lock className="w-5 h-5 text-[#8E7D7D] absolute left-4 top-4 group-focus-within:text-[#7C0A1E] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full pl-12 pr-12 py-4 bg-[#FAF8F5] border border-transparent rounded-2xl text-[14px] text-[#2D1A1E] font-semibold focus:bg-white focus:outline-none focus:border-[#7C0A1E] focus:ring-4 focus:ring-[#7C0A1E]/10 transition-all placeholder:text-[#8E7D7D]/70 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3.5 top-3.5 p-1 text-[#8E7D7D] hover:text-[#2D1A1E] transition-colors rounded-full hover:bg-gray-100"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#7C0A1E] rounded-md border-[#DDD6CE] focus:ring-[#7C0A1E] bg-[#F8F6F4] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-semibold text-[#8E7D7D] cursor-pointer hover:text-[#2D1A1E] transition-colors">
                Recordarme
              </label>
            </div>
            
            <Link
              to="/auth/recover"
              className="text-xs text-[#7C0A1E] font-bold hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#7C0A1E] hover:bg-[#600616] text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-[#7C0A1E]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              "Verificando..."
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="mt-10 mb-8 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#EFE7DE]"></span>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#8E7D7D] font-medium">O continuar con</span>
            </div>
          </div>
        )}

        {/* Botón Continuar con Google */}
        <div className="flex justify-center w-full">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMsg("Error al conectar con Google")}
              useOneTap={false}
              shape="pill"
              text="continue_with"
              theme="outline"
              size="large"
              width="300"
            />
          )}
        </div>

        {/* Registro y Términos */}
        <div className="mt-auto pt-8 text-center pb-2">
          <p className="text-[13px] text-[#8E7D7D] mb-4">
            ¿No tienes cuenta?{" "}
            <Link
              to="/auth/register"
              className="font-bold text-[#7C0A1E] hover:underline"
            >
              Regístrate ahora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
