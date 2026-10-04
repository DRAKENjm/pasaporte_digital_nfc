import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { User } from "../types";
import { authService } from "../services/authService";

// Tiempo de inactividad para cierre de sesión automático (3 minutos)
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (token: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    uid_nfc?: string;
    codigo_invitacion?: string;
  }) => Promise<void>;
  logout: (reason?: string) => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const getStoredToken = (): string | null => {
  return sessionStorage.getItem("token");
};

const getStoredUser = (): User | null => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSessionData = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("pasaporte_uid_nfc");
    sessionStorage.removeItem("comercio_establecimiento_id");
    // Limpiar también cualquier token previo que haya quedado en localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pasaporte_uid_nfc");
    localStorage.removeItem("comercio_establecimiento_id");
  }, []);

  const logout = useCallback((reason?: string) => {
    clearSessionData();
    setToken(null);
    setUser(null);
    if (reason === "inactivity") {
      // Notificar opcionalmente por query param o alert
      if (!window.location.pathname.includes("/auth/login")) {
        window.location.href = "/auth/login?inactivity=1";
      }
    }
  }, [clearSessionData]);

  // Manejo de inactividad de 5 minutos
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Solo activar temporizador si está autenticado
    if (token) {
      inactivityTimerRef.current = setTimeout(() => {
        logout("inactivity");
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Iniciar temporizador inicial
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [token, resetInactivityTimer]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      if (profile && profile.id) {
        const normalized = {
          ...profile,
          role: (
            (profile as any).rol_nombre ||
            profile.rol ||
            profile.role ||
            "CLIENTE"
          ).toUpperCase(),
          rol: (
            (profile as any).rol_nombre ||
            profile.rol ||
            profile.role ||
            "CLIENTE"
          ).toUpperCase(),
        };
        setUser(normalized);
        sessionStorage.setItem("user", JSON.stringify(normalized));
        if (localStorage.getItem("token")) {
          localStorage.setItem("user", JSON.stringify(normalized));
        }
      }
    } catch {
      // No forzar logout si falla una sincronización secundaria de perfil
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedToken = getStoredToken();
      if (savedToken) {
        try {
          const profile = await authService.getProfile();
          const normalized = {
            ...profile,
            role: (
              (profile as any).rol_nombre ||
              profile.rol ||
              profile.role ||
              "CLIENTE"
            ).toUpperCase(),
            rol: (
              (profile as any).rol_nombre ||
              profile.rol ||
              profile.role ||
              "CLIENTE"
            ).toUpperCase(),
          };
          setToken(savedToken);
          setUser(normalized);
          sessionStorage.setItem("token", savedToken);
          sessionStorage.setItem("user", JSON.stringify(normalized));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    init();
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const normalizedUser = {
      ...res.user,
      role: (res.user.rol || res.user.role || "CLIENTE").toUpperCase(),
      rol: (res.user.rol || res.user.role || "CLIENTE").toUpperCase(),
    };

    // Almacenar exclusivamente en sessionStorage (aislado por pestaña y se destruye al cerrar la pestaña)
    sessionStorage.setItem("token", res.token);
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));

    // Asegurar que no quede token activo persistente en localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(res.token);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (data: {
    email: string;
    password: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    uid_nfc?: string;
  }) => {
    await authService.register(data);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await authService.loginWithGoogle(credential);
    const normalizedUser = {
      ...res.user,
      role: (res.user.rol || res.user.role || "CLIENTE").toUpperCase(),
      rol: (res.user.rol || res.user.role || "CLIENTE").toUpperCase(),
    };

    sessionStorage.setItem("token", res.token);
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(res.token);
    setUser(normalizedUser);
    return normalizedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user?.role || user?.rol || null,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
