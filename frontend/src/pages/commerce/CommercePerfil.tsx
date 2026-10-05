import React, { useEffect, useState } from "react";
import { Store, MapPin, Award, Upload, Camera, Save, Phone, Mail, FileText, CheckCircle2, Clock, Globe, Sparkles, DollarSign } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";

interface SucursalAsignada {
  id_sucursal: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  horario?: string | null;
  google_maps_url?: string | null;
  id_establecimiento: string;
  nombre_comercial: string;
  razon_social: string | null;
  ruc: string | null;
  email: string | null;
  telefono_establecimiento: string | null;
  logo?: string | null;
  imagen_portada?: string | null;
  descripcion?: string | null;
  id_programa: string | null;
  programa_nombre: string | null;
  meta_sellos: number | null;
  puntos_por_visita: number | string | null;
  monto_por_punto?: number | string | null;
}

export const CommercePerfil: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [sucursales, setSucursales] = useState<SucursalAsignada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  // Edición de perfil del local
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPortada, setUploadingPortada] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [logo, setLogo] = useState<string>("");
  const [imagenPortada, setImagenPortada] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [horario, setHorario] = useState<string>("");
  const [direccion, setDireccion] = useState<string>("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>("");
  const [montoPorPunto, setMontoPorPunto] = useState<string>("10");
  const [puntosPorSello, setPuntosPorSello] = useState<string>("20");
  const [descripcion, setDescripcion] = useState<string>("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/establishments/me/sucursales")
      .then((res) => {
        if (!active) return;
        const list = res.data.data || [];
        setSucursales(list);
        if (list.length > 0) {
          const first = list[0];
          setLogo(first.logo || "");
          setImagenPortada(first.imagen_portada || "");
          setTelefono(first.telefono_establecimiento || first.telefono || "");
          setEmail(first.email || "");
          setHorario(first.horario || "");
          setDireccion(first.direccion || "");
          setGoogleMapsUrl(first.google_maps_url || "");
          setMontoPorPunto(String(first.monto_por_punto || 10));
          setPuntosPorSello(String(first.puntos_por_visita || 20));
          setDescripcion(first.descripcion || "");
        }
      })
      .catch(() => {
        if (active) setError("No se pudo cargar el perfil de tus establecimientos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, intento]);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, tipo: "logo" | "portada") => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) {
      showToast("Usa una imagen JPG, PNG o WebP", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen no debe superar los 5 MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (tipo === "logo") setUploadingLogo(true);
    else setUploadingPortada(true);

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (tipo === "logo") {
        setLogo(url);
        // Guardar inmediatamente
        await api.put("/establishments/me/perfil", { logo: url });
        showToast("Logotipo del establecimiento actualizado", "success");
      } else {
        setImagenPortada(url);
        await api.put("/establishments/me/perfil", { imagen_portada: url });
        showToast("Imagen de portada actualizada", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al subir la imagen", "error");
    } finally {
      if (tipo === "logo") setUploadingLogo(false);
      else setUploadingPortada(false);
    }
  };

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPerfil(true);
    try {
      await api.put("/establishments/me/perfil", {
        telefono: telefono.trim(),
        email: email.trim(),
        horario: horario.trim(),
        direccion: direccion.trim(),
        google_maps_url: googleMapsUrl.trim(),
        monto_por_punto: Number(montoPorPunto) > 0 ? Number(montoPorPunto) : 10,
        puntos_por_sello: Number(puntosPorSello) > 0 ? Number(puntosPorSello) : 20,
        descripcion: descripcion.trim(),
        logo: logo || undefined,
        imagen_portada: imagenPortada || undefined,
      });
      showToast("Información de contacto, ubicación y reglas de puntos actualizada correctamente", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al guardar cambios", "error");
    } finally {
      setSavingPerfil(false);
    }
  };

  if (loading) {
    return (
      <div role="status" className="py-16 flex flex-col items-center gap-2">
        <Spinner size={32} />
        <p className="text-xs text-[#8E7D7D]">Cargando datos del local...</p>
      </div>
    );
  }

  const locales = [...new Map(sucursales.map((s) => [s.id_establecimiento, s])).values()];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">Perfil del Establecimiento</h1>
        <p className="text-xs text-[#8E7D7D] mt-0.5">
          Gestiona las imágenes de tu marca, datos comerciales y sucursales asignadas
        </p>
      </div>

      {error ? (
        <div role="alert" className="bg-white rounded-3xl p-6 border border-[#EFE7DE] space-y-3">
          <p className="text-sm text-rose-600">{error}</p>
          <button type="button" onClick={() => setIntento((v) => v + 1)} className="text-[#7C0A1E] font-bold text-xs underline">
            Reintentar
          </button>
        </div>
      ) : locales.length === 0 ? (
        <p className="bg-white rounded-3xl p-6 border border-[#EFE7DE] text-sm text-[#8E7D7D]">
          No tienes sucursales activas asignadas. Solicita la asignación al administrador.
        </p>
      ) : (
        locales.map((local) => (
          <section key={local.id_establecimiento} className="bg-white rounded-3xl border border-[#EFE7DE] shadow-xs overflow-hidden space-y-6">
            {/* 1. Portada y Logotipo interactivo */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-r from-[#2D1A1E] to-[#7C0A1E] overflow-hidden">
              {imagenPortada ? (
                <img src={imagenPortada} alt="Portada del local" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <Store size={80} />
                </div>
              )}
              {/* Botón cambiar portada */}
              <label className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 backdrop-blur-xs shadow-md">
                {uploadingPortada ? <Spinner size={14} /> : <Camera size={14} />}
                <span>{imagenPortada ? "Cambiar portada" : "Subir portada"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingPortada}
                  onChange={(e) => handleUploadImage(e, "portada")}
                />
              </label>

              {/* Logotipo Flotante sobre la portada */}
              <div className="absolute -bottom-2 left-6 sm:left-8 translate-y-1/2 flex items-end gap-4">
                <div className="relative group w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-white overflow-hidden">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-[#FAF8F5] rounded-xl flex items-center justify-center text-[#7C0A1E]">
                      <Store size={36} />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer rounded-xl">
                    {uploadingLogo ? <Spinner size={16} /> : <Upload size={16} />}
                    <span className="mt-1">Cambiar</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) => handleUploadImage(e, "logo")}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Espaciado para el logo flotante */}
            <div className="pt-10 px-6 sm:px-8 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Establecimiento activo
                </span>
                <h2 className="text-2xl font-black text-[#2D1A1E] mt-1.5">{local.nombre_comercial}</h2>
                <p className="text-xs text-[#8E7D7D] mt-0.5">
                  RUC: <strong className="font-mono text-[#2D1A1E]">{local.ruc || "No registrado"}</strong> · Razón social: {local.razon_social || "No registrada"}
                </p>
              </div>

              {/* 2. Formulario de Contacto Actualizable */}
              <form onSubmit={handleGuardarDatos} className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EFE7DE] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D1A1E] flex items-center gap-2">
                  <Phone size={14} className="text-[#7C0A1E]" />
                  <span>Datos de Contacto y Atención</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="space-y-1 block">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <Phone size={12} className="text-[#7C0A1E]" />
                      Teléfono de Contacto
                    </span>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. +51 987654321"
                      className="input-base text-xs"
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <Mail size={12} className="text-[#7C0A1E]" />
                      Correo Electrónico Comercial
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@local.com"
                      className="input-base text-xs"
                    />
                  </label>
                  <label className="space-y-1 block sm:col-span-2">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <Clock size={12} className="text-[#7C0A1E]" />
                      Horario de Atención
                    </span>
                    <input
                      type="text"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      placeholder="Ej. Lun - Sáb: 8:00 AM - 10:00 PM · Dom: 9:00 AM - 6:00 PM"
                      className="input-base text-xs"
                    />
                  </label>
                  <label className="space-y-1 block sm:col-span-2">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#7C0A1E]" />
                      Dirección de la Sede Principal
                    </span>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej. Av. Balta 450, Chiclayo"
                      className="input-base text-xs"
                    />
                  </label>
                  <label className="space-y-1 block sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#736868] flex items-center gap-1.5">
                        <Globe size={12} className="text-[#7C0A1E]" />
                        Enlace de Ubicación en Google Maps
                      </span>
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#7C0A1E] font-bold hover:underline flex items-center gap-0.5"
                        >
                          Ver en Maps ↗
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="Ej. https://maps.app.goo.gl/... o https://www.google.com/maps/place/..."
                      className="input-base text-xs font-mono"
                    />
                    <p className="text-[10px] text-[#8E7D7D] pt-0.5">
                      Las coordenadas GPS se actualizan automáticamente al ingresar el enlace de Google Maps.
                    </p>
                  </label>
                  <label className="space-y-1 block">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#C5A059]" />
                      Regla de Puntos por Consumo (Soles por 1 Punto)
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-[#8E7D7D]">S/</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={montoPorPunto}
                        onChange={(e) => setMontoPorPunto(e.target.value)}
                        placeholder="10"
                        className="input-base text-xs pl-8 font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-[#8E7D7D] pt-0.5">
                      El cliente ganará 1 punto por cada S/ {montoPorPunto || 10} gastados en su compra.
                    </p>
                  </label>

                  <label className="space-y-1 block">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <Award size={12} className="text-[#7C0A1E]" />
                      Puntos Otorgados por Sello Diario
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={puntosPorSello}
                        onChange={(e) => setPuntosPorSello(e.target.value)}
                        placeholder="20"
                        className="input-base text-xs pr-10 font-bold"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-[#8E7D7D]">pts</span>
                    </div>
                    <p className="text-[10px] text-[#8E7D7D] pt-0.5">
                      Puntos acreditados automáticamente al estampar el sello diario del cliente.
                    </p>
                  </label>
                  <label className="space-y-1 block sm:col-span-2">
                    <span className="font-bold text-[#736868] flex items-center gap-1.5">
                      <FileText size={12} className="text-[#7C0A1E]" />
                      Descripción de Marca / Sobre Nosotros
                    </span>
                    <textarea
                      rows={2}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Escribe una breve descripción del local, especialidades o redes sociales..."
                      className="input-base text-xs resize-none"
                    />
                  </label>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingPerfil}
                    className="px-4 py-2 rounded-xl bg-[#7C0A1E] text-white text-xs font-bold hover:bg-[#600616] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {savingPerfil ? <Spinner size={14} /> : <Save size={14} />}
                    <span>Guardar datos y reglas del local</span>
                  </button>
                </div>
              </form>

              {/* 3. Programa de Sellos y Puntos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#EFE7DE]">
                  <span className="font-bold text-[#8E7D7D] uppercase text-[10px] block">Programa de Sellos Digital</span>
                  <p className="flex items-center gap-2 font-bold text-[#2D1A1E] text-sm mt-1">
                    <Award size={16} className="text-[#7C0A1E]" />
                    {local.id_programa ? `${local.programa_nombre} (${local.meta_sellos} sellos)` : "Sin programa activo"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#EFE7DE]">
                  <span className="font-bold text-[#8E7D7D] uppercase text-[10px] block">Puntos por Sello Diario</span>
                  <p className="font-black text-[#C5A059] text-base mt-1">
                    {local.id_programa ? `+${local.puntos_por_visita ?? 20} pts` : "No aplica"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#EFE7DE]">
                  <span className="font-bold text-[#8E7D7D] uppercase text-[10px] block">Puntos por Consumo</span>
                  <p className="font-black text-[#7C0A1E] text-base mt-1">
                    +1 pt cada S/ {montoPorPunto || 10}
                  </p>
                </div>
              </div>

              {/* 4. Sucursales asignadas */}
              <div className="space-y-3 border-t border-[#EFE7DE] pt-4 pb-6">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#2D1A1E]">
                  <MapPin size={16} className="text-[#7C0A1E]" />
                  <span>Sucursales Asignadas ({sucursales.filter((s) => s.id_establecimiento === local.id_establecimiento).length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sucursales
                    .filter((s) => s.id_establecimiento === local.id_establecimiento)
                    .map((sucursal) => (
                      <div key={sucursal.id_sucursal} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFE7DE] space-y-1">
                        <h4 className="text-xs font-bold text-[#2D1A1E]">{sucursal.nombre}</h4>
                        <p className="text-[11px] text-[#8E7D7D]">{sucursal.direccion || "Dirección no registrada"}</p>
                        <p className="text-[11px] text-[#8E7D7D]">Teléfono: {sucursal.telefono || "No registrado"}</p>
                        {sucursal.google_maps_url && (
                          <a
                            href={sucursal.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#7C0A1E] font-medium flex items-center gap-1 pt-0.5 hover:underline"
                          >
                            <Globe size={11} />
                            <span>Ver ubicación en Google Maps ↗</span>
                          </a>
                        )}
                        {sucursal.horario && (
                          <p className="text-[11px] text-[#7C0A1E] font-medium flex items-center gap-1 pt-0.5">
                            <Clock size={11} />
                            <span>{sucursal.horario}</span>
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
};
