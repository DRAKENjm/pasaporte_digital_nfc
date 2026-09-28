import React, { useEffect, useState } from "react";
import { Store, MapPin, Award } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Spinner } from "../../components/common/Spinner";

interface SucursalAsignada {
  id_sucursal: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  id_establecimiento: string;
  nombre_comercial: string;
  razon_social: string | null;
  ruc: string | null;
  email: string | null;
  telefono_establecimiento: string | null;
  id_programa: string | null;
  programa_nombre: string | null;
  meta_sellos: number | null;
  puntos_por_visita: number | string | null;
}

export const CommercePerfil: React.FC = () => {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<SucursalAsignada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSucursales([]);
    api.get("/establishments/me/sucursales")
      .then(res => { if (active) setSucursales(res.data.data || []); })
      .catch(() => { if (active) setError("No se pudo cargar el perfil de tus establecimientos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, intento]);

  if (loading) return (
    <div role="status" className="py-16 flex flex-col items-center gap-2">
      <Spinner size={32} />
      <p className="text-xs text-[#8E7D7D]">Cargando datos del local...</p>
    </div>
  );

  const locales = [...new Map(sucursales.map(s => [s.id_establecimiento, s])).values()];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Perfil del Establecimiento</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">Información comercial y sucursales activas asignadas a tu cuenta</p>
      </div>
      {error ? (
        <div role="alert" className="bg-white rounded-3xl p-6 border border-[#EFE7DE] space-y-3">
          <p>{error}</p>
          <button type="button" onClick={() => setIntento(v => v + 1)} className="text-[#7C0A1E] font-bold">Reintentar</button>
        </div>
      ) : locales.length === 0 ? (
        <p className="bg-white rounded-3xl p-6 border border-[#EFE7DE] text-sm text-[#8E7D7D]">
          No tienes sucursales activas asignadas. Solicita la asignación al administrador.
        </p>
      ) : locales.map(local => (
        <section key={local.id_establecimiento} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE7DE] shadow-xs space-y-6">
          <div className="flex items-center gap-4">
            <Store size={32} className="text-[#7C0A1E] shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Establecimiento activo</span>
              <h2 className="text-2xl font-black text-[#2D1A1E]">{local.nombre_comercial}</h2>
              <p className="text-xs text-[#8E7D7D]">RUC: {local.ruc || "No registrado"} · Razón social: {local.razon_social || "No registrada"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <p>Teléfono: {local.telefono_establecimiento || "No registrado"}</p>
            <p className="break-words">Correo: {local.email || "No registrado"}</p>
            <div>
              <span className="font-bold text-[#8E7D7D] uppercase">Programa de sellos</span>
              <p className="flex items-center gap-2 font-bold text-[#2D1A1E] mt-1">
                <Award size={15} className="text-[#7C0A1E]" />
                {local.id_programa ? `${local.programa_nombre} (${local.meta_sellos} sellos)` : "Sin programa activo"}
              </p>
            </div>
            <div>
              <span className="font-bold text-[#8E7D7D] uppercase">Puntos por visita</span>
              <p className="font-bold text-[#C5A059] mt-1">{local.id_programa ? `${local.puntos_por_visita ?? 0} puntos` : "No aplica"}</p>
            </div>
          </div>
          <div className="space-y-3 border-t border-[#EFE7DE] pt-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#2D1A1E]"><MapPin size={16} />Sucursales asignadas</h3>
            {sucursales.filter(s => s.id_establecimiento === local.id_establecimiento).map(sucursal => (
              <div key={sucursal.id_sucursal} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] space-y-1">
                <h4 className="text-sm font-bold text-[#2D1A1E]">{sucursal.nombre}</h4>
                <p className="text-xs text-[#8E7D7D]">{sucursal.direccion || "Dirección no registrada"}</p>
                <p className="text-xs text-[#8E7D7D]">Teléfono: {sucursal.telefono || "No registrado"}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
