import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, AlertCircle, UserX, KeyRound, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import { useUI } from '../../hooks/useUI';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

interface ErrorDialogState {
  isOpen: boolean;
  type: 'not_found' | 'invalid_password' | 'generic';
  title: string;
  message: string;
}

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Modal de error personalizado
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
    isOpen: false,
    type: 'generic',
    title: '',
    message: '',
  });

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const closeDialog = () => {
    setErrorDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast('Por favor completa todos los campos', 'info');
      return;
    }

    setLoading(true);
    try {
      const loggedUser: any = await login(identifier.trim(), password);
      showToast('¡Sesión iniciada con éxito!', 'success');
      
      const userRole = (loggedUser?.role || loggedUser?.rol || '').toUpperCase();
      if (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR') {
        navigate('/admin');
      } else if (userRole === 'COMERCIO' || userRole === 'COMMERCE') {
        navigate('/commerce');
      } else {
        navigate('/user/wallet');
      }
    } catch (err: any) {
      const serverMsg: string = err.response?.data?.message || '';
      const status: number = err.response?.status || 0;

      if (
        serverMsg.toLowerCase().includes('no encontrado') ||
        serverMsg.toLowerCase().includes('usuario no existe') ||
        serverMsg.toLowerCase().includes('no registrado') ||
        status === 404
      ) {
        setErrorDialog({
          isOpen: true,
          type: 'not_found',
          title: 'Usuario no encontrado',
          message: `No existe ninguna cuenta asociada a "${identifier}". Verifica que el correo o usuario esté bien escrito.`,
        });
      } else if (
        serverMsg.toLowerCase().includes('credenciales incorrectas') ||
        serverMsg.toLowerCase().includes('contraseña') ||
        status === 401
      ) {
        setErrorDialog({
          isOpen: true,
          type: 'invalid_password',
          title: 'Credenciales incorrectas',
          message: 'El usuario o la contraseña ingresada no son correctos. Por favor, revísalos e inténtalo de nuevo.',
        });
      } else {
        setErrorDialog({
          isOpen: true,
          type: 'generic',
          title: 'Error al iniciar sesión',
          message: serverMsg || 'Ocurrió un inconveniente al conectar con el servidor. Por favor intenta de nuevo en unos momentos.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID no configurado');
      return;
    }

    const initGoogle = () => {
      // @ts-ignore
      if (!window.google?.accounts?.id) return;

      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          if (!response.credential) return;
          setGoogleLoading(true);
          try {
            const loggedUser: any = await loginWithGoogle(response.credential);
            showToast('¡Acceso verificado con Google!', 'success');
            const userRole = (loggedUser?.role || loggedUser?.rol || '').toUpperCase();
            if (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR') {
              navigate('/admin');
            } else if (userRole === 'COMERCIO' || userRole === 'ESTABLECIMIENTO') {
              navigate('/commerce');
            } else {
              navigate('/wallet');
            }
          } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al autenticar con Google';
            showToast(msg, 'error');
          } finally {
            setGoogleLoading(false);
          }
        },
        auto_select: false,
      });

    if (googleButtonRef.current) {
      // @ts-ignore
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth || 320,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    }
  };

  // Cargar script de Google Identity Services si no está
  // @ts-ignore
  if (window.google?.accounts?.id) {
    initGoogle();
  } else {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }
}, [loginWithGoogle, navigate, showToast]);

  return (
    <>
      <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl shadow-black/40">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-white">¡Hola de nuevo!</h2>
          <p className="text-xs text-slate-400 mt-1">Ingresa tus datos para acceder a tu pasaporte</p>
        </div>

        {/* Botón de acceso con Google */}
        <div className="w-full flex flex-col items-center justify-center">
          <div className="w-full min-h-[44px] flex justify-center" ref={googleButtonRef} />
          {googleLoading && (
            <p className="text-center text-xs text-slate-400 mt-2">Conectando con Google...</p>
          )}
        </div>

        {/* Separador */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-medium tracking-wider uppercase text-slate-500 absolute">
            o con tus credenciales
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Usuario o Correo Electrónico"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ej. cliente@demo.com o tu_usuario"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span />
              <Link
                to="/auth/recover"
                className="text-xs text-sky-400 hover:text-sky-300 transition font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              label="Contraseña"
              type="password"
              isPassword={true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 mt-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20"
            loading={loading}
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso seguro protegido por chip NFC & Encriptación</span>
          </div>
        </form>
      </div>

      {/* Modal / Cuadro de Diálogo de Error */}
      {errorDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={closeDialog}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-rose-950/20 relative animate-scaleUp text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDialog}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icono temático según el tipo de error */}
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {errorDialog.type === 'not_found' ? (
                <UserX className="w-6 h-6" />
              ) : errorDialog.type === 'invalid_password' ? (
                <KeyRound className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{errorDialog.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              {errorDialog.message}
            </p>

            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={closeDialog}
                className="w-full bg-rose-600 hover:bg-rose-500 focus:ring-rose-500 py-2.5 text-sm font-semibold rounded-xl"
              >
                Entendido
              </Button>
              {errorDialog.type === 'invalid_password' && (
                <Link
                  to="/auth/recover"
                  onClick={closeDialog}
                  className="text-xs text-sky-400 hover:text-sky-300 pt-1 font-medium hover:underline"
                >
                  Restablecer mi contraseña
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
