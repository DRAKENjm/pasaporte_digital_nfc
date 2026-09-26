import React, { useEffect, useState } from "react";
import { Store, MapPin, Phone, Mail, Clock, ShieldCheck, Award } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Spinner } from "../../components/common/Spinner";

export const CommercePerfil: React.FC = () => {
  const { user } = useAuth();
  const [local, setLocal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get("/establishments");
        const list = res.data.data || [];
        if (list.length > 0) {
          setLocal(list[0]);
        }
      } catch (e) {
        console.error("Error al cargar perfil del local", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2">
        <Spinner size={32} />
        <p className="text-xs text-[#8E7D7D]">Cargando datos del local...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Perfil del Establecimiento</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Información comercial, sedes afiliadas y programa de fidelización activo
        </p>
      </div>

      {/* Card Principal de Establecimiento */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] flex items-center justify-center font-bold text-3xl shadow-inner shrink-0">
            ☕
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Establecimiento Afiliado Activo
            </span>
            <h2 className="text-2xl font-black text-[#2D1A1E] mt-1">
              {local?.nombre_comercial || local?.razon_social || "Aroma Café"}
            </h2>
            <p className="text-xs text-[#8E7D7D]">
              RUC: {local?.ruc || "20601234567"} · Razón Social: {local?.razon_social || "Aroma Café S.A.C."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#EFE7DE] text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E7D7D] uppercase">Programa de Sellos</span>
            <p className="font-bold text-[#2D1A1E] flex items-center gap-1.5">
              <Award size={15} className="text-[#7C0A1E]" />
              {local?.programa_nombre || "Pasaporte Aroma Café (10 Sellos)"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E7D7D] uppercase">Puntos Otorgados por Visita</span>
            <p className="font-bold text-[#C5A059]">
              +20 puntos acumulables en Pasaporte Digital
            </p>
          </div>
        </div>
      </div>

      {/* Sucursales Asignadas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EFE7DE] pb-3">
          <MapPin className="w-4 h-4 text-[#7C0A1E]" />
          <h3 className="text-sm font-bold text-[#2D1A1E]">Sucursal y Terminal Asignada</h3>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#2D1A1E]">Sede Principal</h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Habilitada para Lectura NFC
            </span>
          </div>
          <p className="text-xs text-[#8E7D7D]">
            Av. José Balta 850, Chiclayo, Lambayeque
          </p>
          <div className="pt-2 text-[11px] text-[#8E7D7D] flex items-center gap-4">
            <span>Horario: 08:00 AM - 10:00 PM</span>
            <span>Teléfono: (074) 283920</span>
          </div>
        </div>
      </div>
    </div>
  );
};
