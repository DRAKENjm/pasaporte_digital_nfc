import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Shield, 
  Save, 
  Database, 
  CheckCircle2, 
  Globe,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  AlertCircle
} from "lucide-react";
import api from "../../services/api";
import { useConfig } from "../../context/ConfigContext";
import { useUI } from "../../hooks/useUI";

export const AdminConfiguracion: React.FC = () => {
  const { config, appLogo, refreshConfig, updateConfigLocally } = useConfig();
  const { showToast } = useUI();

  const [nombreSistema, setNombreSistema] = useState(config.nombre_proyecto || "Pasaporte Digital NFC");
  const [logoPrincipal, setLogoPrincipal] = useState<string>(config.logo_principal || "");
  const [correoSoporte, setCorreoSoporte] = useState(config.correo_soporte || "soporte@pasaporte.digital");
  const [telefonoSoporte, setTelefonoSoporte] = useState(config.telefono_soporte || "+51 999 888 777");
  const [colorPrimario, setColorPrimario] = useState(config.color_primario || "#7C0A1E");
  const [colorSecundario, setColorSecundario] = useState(config.color_secundario || "#C5A059");
  
  const [diasRespuestaReclamos, setDiasRespuestaReclamos] = useState("15");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cargar configuración de base de datos al montar
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/admin/configuracion");
        const data = res.data?.data || res.data;
        if (data) {
          if (data.nombre_proyecto) setNombreSistema(data.nombre_proyecto);
          if (data.logo_principal) setLogoPrincipal(data.logo_principal);
          if (data.correo_soporte) setCorreoSoporte(data.correo_soporte);
          if (data.telefono_soporte) setTelefonoSoporte(data.telefono_soporte);
          if (data.color_primario) setColorPrimario(data.color_primario);
          if (data.color_secundario) setColorSecundario(data.color_secundario);
        }
      } catch (e) {
        console.error("Error cargando configuración admin:", e);
      }
    };
    fetchConfig();
  }, []);

  // Subir nuevo logo de la empresa
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecciona un archivo de imagen (PNG, JPG, WebP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("El archivo no debe exceder los 5MB", "error");
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        setLogoPrincipal(uploadedUrl);
        // Pre-actualizar en contexto para preview instantáneo
        updateConfigLocally({ logo_principal: uploadedUrl });
        showToast("Logotipo cargado con éxito. Haz clic en Guardar para aplicar a toda la plataforma.", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al subir la imagen del logo", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRestaurarLogoPorDefecto = () => {
    setLogoPrincipal("");
    updateConfigLocally({ logo_principal: null });
    showToast("Se restableció al logotipo de referencia por defecto.", "info");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre_proyecto: nombreSistema,
        logo_principal: logoPrincipal || null,
        logo_reducido: logoPrincipal || null,
        correo_soporte: correoSoporte,
        telefono_soporte: telefonoSoporte,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
      };

      await api.put("/admin/configuracion", payload);
      await refreshConfig();
      setSaved(true);
      showToast("¡Configuración y logotipo actualizados en toda la plataforma!", "success");
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al guardar la configuración", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E]">Configuración del Sistema</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Identidad de marca, logotipo oficial, parámetros legales y estado de base de datos
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Sección: Identidad de Marca y Logotipo */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#EFE7DE] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C0A1E]" />
              <h3 className="text-sm font-bold text-[#2D1A1E]">Identidad y Logotipo Oficial</h3>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              Personalizable
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Previsualización del Logo */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-28 h-28 rounded-3xl border-2 border-[#EFE7DE] bg-[#FAF8F5] p-3 flex items-center justify-center shadow-inner relative group overflow-hidden">
                <img
                  src={logoPrincipal || "/logo-icon.png"}
                  alt="Logo Actual"
                  className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo-icon.png";
                  }}
                />
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold backdrop-blur-xs">
                    Subiendo...
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#8E7D7D] font-medium text-center">
                {logoPrincipal ? "Logotipo oficial cargado" : "Logo actual de referencia"}
              </span>
            </div>

            {/* Acciones de carga */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                  Actualizar Logotipo de la Empresa
                </label>
                <p className="text-[11px] text-[#59494B] mb-2 leading-relaxed">
                  El logo actual es solo una primera referencia. Sube el logotipo oficial para que se actualice dinámicamente en la webapp de usuarios, menú de administración y panel de comercios.
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold cursor-pointer hover:bg-[#600616] transition shadow-xs">
                    <Upload size={14} />
                    <span>{uploadingLogo ? "Subiendo..." : "Subir nuevo logotipo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>

                  {logoPrincipal && (
                    <button
                      type="button"
                      onClick={handleRestaurarLogoPorDefecto}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] text-[#8E7D7D] hover:text-[#7C0A1E] text-xs font-bold transition"
                      title="Restablecer al logo de referencia inicial"
                    >
                      <RotateCcw size={13} />
                      <span>Restablecer referencia</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#8E7D7D] mt-2 block">
                  Recomendado: PNG o WebP con fondo transparente, formato cuadrado o circular (512x512 px).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Parámetros Generales de la Plataforma */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
            <Globe className="w-4 h-4 text-[#7C0A1E]" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Parámetros de la Plataforma</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Nombre de la Plataforma / Empresa
              </label>
              <input
                type="text"
                value={nombreSistema}
                onChange={(e) => setNombreSistema(e.target.value)}
                placeholder="Ej. Pasaporte Digital NFC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Correo de Soporte
              </label>
              <input
                type="email"
                value={correoSoporte}
                onChange={(e) => setCorreoSoporte(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Teléfono de Soporte
              </label>
              <input
                type="text"
                value={telefonoSoporte}
                onChange={(e) => setTelefonoSoporte(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Reglas de Sellos y Puntos
              </label>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] text-[11px] text-[#2D1A1E] font-medium flex items-center justify-between">
                <span>Personalizado por cada local</span>
                <span className="text-[10px] text-[#7C0A1E] font-bold">Módulo Visitas / Reglas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parámetros Legales y de Cumplimiento */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
            <Shield className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Cumplimiento Normativo (Perú)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Plazo Máximo Reclamaciones (Días Hábiles - Indecopi)
              </label>
              <input
                type="number"
                value={diasRespuestaReclamos}
                onChange={(e) => setDiasRespuestaReclamos(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-semibold text-[#2D1A1E] focus:outline-none focus:border-[#7C0A1E]"
              />
              <span className="text-[10px] text-[#8E7D7D] mt-1 block">Estándar legal: 15 días hábiles (Ley 29571)</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Protección de Datos Personales
              </label>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFE7DE] text-[11px] text-[#2D1A1E] font-medium">
                Ley N° 29733 y D.S. 016-2024-JUS (Auditoría activa)
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Base de Datos */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Base de Datos PostgreSQL</h3>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[#8E7D7D]">Tabla de Configuración:</span>
            <span className="font-bold text-[#2D1A1E]">configuracion_sistema (Activa)</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[#8E7D7D]">Ledger Contable:</span>
            <span className="font-bold text-emerald-600">Inmutable (movimientos_puntos)</span>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#600616] transition disabled:opacity-60 cursor-pointer"
          >
            {saved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving
                ? "Guardando cambios..."
                : saved
                ? "¡Configuración Guardada!"
                : "Guardar Configuración"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
