import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

export interface SystemConfig {
  nombre_proyecto: string;
  logo_principal: string | null;
  logo_reducido: string | null;
  color_primario: string;
  color_secundario: string;
  correo_soporte: string;
  telefono_soporte: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  nombre_proyecto: "Pasaporte Digital NFC",
  logo_principal: null,
  logo_reducido: null,
  color_primario: "#7C0A1E",
  color_secundario: "#C5A059",
  correo_soporte: "soporte@pasaporte.digital",
  telefono_soporte: "+51 999 888 777",
};

interface ConfigContextType {
  config: SystemConfig;
  appLogo: string;
  refreshConfig: () => Promise<void>;
  updateConfigLocally: (newConfig: Partial<SystemConfig>) => void;
}

const ConfigContext = createContext<ConfigContextType>({
  config: DEFAULT_CONFIG,
  appLogo: "/logo-icon.png",
  refreshConfig: async () => {},
  updateConfigLocally: () => {},
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(() => {
    try {
      const cached = localStorage.getItem("pd_system_config");
      return cached ? JSON.parse(cached) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const refreshConfig = useCallback(async () => {
    try {
      const res = await api.get("/config");
      const data = res.data?.data || res.data;
      if (data) {
        setConfig((prev) => {
          const merged = { ...prev, ...data };
          localStorage.setItem("pd_system_config", JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      // Si falla, se mantiene la configuración local / caché
    }
  }, []);

  const updateConfigLocally = useCallback((newConfig: Partial<SystemConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      localStorage.setItem("pd_system_config", JSON.stringify(merged));
      return merged;
    });
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Si hay logo personalizado en la base de datos se usa ese, sino el logo de referencia por defecto
  const appLogo = config.logo_principal || config.logo_reducido || "/logo-icon.png";

  return (
    <ConfigContext.Provider value={{ config, appLogo, refreshConfig, updateConfigLocally }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
