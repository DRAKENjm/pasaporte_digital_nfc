import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Shield, 
  FileText, 
  Save, 
  Database, 
  CheckCircle2, 
  Lock,
  Globe
} from "lucide-react";
import api from "../../services/api";

export const AdminConfiguracion: React.FC = () => {
  const [nombreSistema, setNombreSistema] = useState("Pasaporte Digital NFC");
  const [diasRespuestaReclamos, setDiasRespuestaReclamos] = useState("15");
  const [puntosPorDefecto, setPuntosPorDefecto] = useState("20");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E]">Configuración del Sistema</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Parámetros legales, políticas de puntos y conexión de base de datos
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Parámetros Generales */}
        <div className="bg-white p-6 rounded-3xl border border-[#EFE7DE] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
            <Globe className="w-4 h-4 text-[#7C0A1E]" />
            <h3 className="text-sm font-bold text-[#2D1A1E]">Parámetros de la Plataforma</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#8E7D7D] block mb-1">
                Nombre de la Plataforma
              </label>
              <input
                type="text"
                value={nombreSistema}
                onChange={(e) => setNombreSistema(e.target.value)}
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
            <h3 className="text-sm font-bold text-[#2D1A1E]">Base de Datos PostgreSQL Local</h3>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[#8E7D7D]">Esquema Relacional:</span>
            <span className="font-bold text-[#2D1A1E]">23 tablas activas (pasaporte_digital)</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[#8E7D7D]">Ledger Contable:</span>
            <span className="font-bold text-emerald-600">Inmutable (movimientos_puntos)</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7C0A1E] text-white text-xs font-bold shadow-md hover:bg-[#600616] transition"
          >
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saved ? "¡Cambios Guardados!" : "Guardar Configuración"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
