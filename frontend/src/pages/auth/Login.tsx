import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Lock,
  Mail,
  Clock,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { useUI } from "../../hooks/useUI";

const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO_SEGUNDOS = 60;

interface ErrorDialogState {
  isOpen: boolean;
  type: "not_found" | "invalid_password" | "locked" | "generic";
  title: string;
  message: string;
  intentosRestantes?: number;
}

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem("remembered_identifier") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem("remembered_identifier");
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Control de Intentos Fallidos y Bloqueo
  const [intentosFallidos, setIntentosFallidos] = useState<number>(() => {
    const saved = sessionStorage.getItem("auth_intentos_fallidos");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [tiempoRestanteBloqueo, setTiempoRestanteBloqueo] = useState<number>(() => {
    const lockoutUntil = sessionStorage.getItem("auth_lockout_until");
    if (!lockoutUntil) return 0;
    const diff = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  // Modal de diálogo formal de seguridad
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
    isOpen: false,
    type: "generic",
    title: "",
    message: "",
  });

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  // Temporizador de cuenta regresiva de bloqueo temporal
  useEffect(() => {
    if (tiempoRestanteBloqueo <= 0) return;

    const interval = setInterval(() => {
      setTiempoRestanteBloqueo((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem("auth_lockout_until");
          sessionStorage.removeItem("auth_intentos_fallidos");
          setIntentosFallidos(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tiempoRestanteBloqueo]);

  const closeDialog = () => {
    setErrorDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const activarBloqueoSeguridad = () => {
    const lockoutTimestamp = Date.now() + TIEMPO_BLOQUEO_SEGUNDOS * 1000;
    sessionStorage.setItem("auth_lockout_until", lockoutTimestamp.toString());
    setTiempoRestanteBloqueo(TIEMPO_BLOQUEO_SEGUNDOS);
    setErrorDialog({
      isOpen: true,
      type: "locked",
      title: "Acceso Suspendido Temporalmente",
      message: `Ha superado el límite de ${MAX_INTENTOS} intentos fallidos permitidos. Por motivos de seguridad, el formulario permanecerá bloqueado durante ${TIEMPO_BLOQUEO_SEGUNDOS} segundos.`,
    });
  };

  const registrarIntentoFallido = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    sessionStorage.setItem("auth_intentos_fallidos", nuevosIntentos.toString());

    if (nuevosIntentos >= MAX_INTENTOS) {
      activarBloqueoSeguridad();
    } else {
      const restantes = MAX_INTENTOS - nuevosIntentos;
      setErrorDialog({
        isOpen: true,
        type: "invalid_password",
        title: "Credenciales Incorrectas",
        message: `La contraseña o el usuario ingresado no coinciden. Le quedan ${restantes} ${
          restantes === 1 ? "intento" : "intentos"
        } antes del bloqueo temporal.`,
        intentosRestantes: restantes,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tiempoRestanteBloqueo > 0) {
      setErrorDialog({
        isOpen: true,
        type: "locked",
        title: "Acceso Bloqueado",
        message: `Por favor espere ${tiempoRestanteBloqueo} segundos para volver a intentar ingresar.`,
      });
      return;
    }

    if (!identifier.trim() || !password) {
      showToast("Por favor complete los campos requeridos.", "info");
      return;
    }

    setLoading(true);
    try {
      const loggedUser: any = await login(identifier.trim(), password);

      // Recordar en este equipo si el usuario lo seleccionó
      if (rememberMe) {
        localStorage.setItem("remembered_identifier", identifier.trim());
      } else {
        localStorage.removeItem("remembered_identifier");
      }

      sessionStorage.removeItem("auth_intentos_fallidos");
      sessionStorage.removeItem("auth_lockout_until");
      setIntentosFallidos(0);

      const userRole = (loggedUser?.role || loggedUser?.rol || "").toUpperCase();
      if (userRole === "ADMIN" || userRole === "ADMINISTRADOR") {
        navigate("/admin");
      } else if (userRole === "COMERCIO" || userRole === "COMMERCE") {
        navigate("/commerce");
      } else {
        navigate("/user/home");
      }
    } catch (err: any) {
      const serverMsg: string = err.response?.data?.message || "";
      const status: number = err.response?.status || 0;

      if (
        serverMsg.toLowerCase().includes("no encontrado") ||
        serverMsg.toLowerCase().includes("usuario no existe") ||
        serverMsg.toLowerCase().includes("no registrado") ||
        status === 404
      ) {
        setErrorDialog({
          isOpen: true,
          type: "not_found",
          title: "Usuario No Encontrado",
          message: `No existe ninguna cuenta asociada a "${identifier}".`,
        });
      } else if (
        serverMsg.toLowerCase().includes("credenciales incorrectas") ||
        serverMsg.toLowerCase().includes("contraseña") ||
        status === 401
      ) {
        registrarIntentoFallido();
      } else {
        setErrorDialog({
          isOpen: true,
          type: "generic",
          title: "Error de Conexión",
          message:
            serverMsg ||
            "No se pudo conectar con el servidor. Intente nuevamente en unos instantes.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) return;
    setGoogleLoading(true);
    try {
      const loggedUser: any = await loginWithGoogle(credentialResponse.credential);
      sessionStorage.removeItem("auth_intentos_fallidos");
      sessionStorage.removeItem("auth_lockout_until");

      const userRole = (loggedUser?.role || loggedUser?.rol || "").toUpperCase();
      if (userRole === "ADMIN" || userRole === "ADMINISTRADOR") {
        navigate("/admin");
      } else if (userRole === "COMERCIO" || userRole === "COMMERCE") {
        navigate("/commerce");
      } else {
        navigate("/user/home");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo iniciar sesión con Google", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLocked = tiempoRestanteBloqueo > 0;

  return (
    <>
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
        {/* Cabecera */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-slate-500">
            Ingrese sus credenciales de acceso
          </p>
        </div>

        {/* Advertencia de Bloqueo Temporal si aplica */}
        {isLocked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Acceso pausado por seguridad</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Espere <strong>{tiempoRestanteBloqueo} segundos</strong> para reintentar.
              </p>
            </div>
          </div>
        )}

        {/* Advertencia de intentos fallidos */}
        {!isLocked && intentosFallidos > 0 && intentosFallidos < MAX_INTENTOS && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Intento {intentosFallidos} de {MAX_INTENTOS}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">
              Queda {MAX_INTENTOS - intentosFallidos} {MAX_INTENTOS - intentosFallidos === 1 ? "intento" : "intentos"}
            </span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Usuario o Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                disabled={isLocked || loading}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="correo@ejemplo.com o usuario"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 disabled:bg-slate-100 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Contraseña
              </label>
              <Link
                to="/auth/recover"
                className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline transition"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLocked || loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 disabled:bg-slate-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 transition"
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Recordar en este equipo */}
          <div className="flex items-center">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs text-slate-600">
                Recordar en este equipo
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              "Verificando..."
            ) : isLocked ? (
              `Bloqueado (${tiempoRestanteBloqueo}s)`
            ) : (
              <>
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separador */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider">
            O continuar con
          </span>
        </div>

        {/* Google OAuth */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              showToast("Inconveniente con la autenticación de Google", "error")
            }
            theme="outline"
            size="large"
            shape="pill"
            text="signin_with"
          />
        </div>

        {/* Registro */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿No tiene cuenta?{" "}
            <Link
              to="/auth/register"
              className="font-semibold text-slate-900 hover:underline"
            >
              Registrarse como cliente
            </Link>
          </p>
        </div>
      </div>

      {/* Modal formal de advertencia / seguridad */}
      {errorDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  errorDialog.type === "locked"
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : errorDialog.type === "invalid_password"
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {errorDialog.type === "locked" ? (
                  <Lock className="w-4 h-4" />
                ) : errorDialog.type === "invalid_password" ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {errorDialog.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {errorDialog.message}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {errorDialog.type === "invalid_password" && (
                <Link
                  to="/auth/recover"
                  onClick={closeDialog}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl text-center transition"
                >
                  Restablecer Contraseña
                </Link>
              )}

              <button
                type="button"
                onClick={closeDialog}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
