import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useUI } from "../../hooks/useUI";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { DigitalStampBadge } from "../../components/common/DigitalStampBadge";
import {
  Stamp,
  Upload,
  Sparkles,
  Palette,
  CheckCircle2,
  Save,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Award,
} from "lucide-react";

// Paleta oficial de tintas notariales y de pasaportes históricos
const INK_PALETTE = [
  { name: "Borgoña Pasaporte", hex: "#7C0A1E", desc: "Tono oficial institucional" },
  { name: "Azul Notarial", hex: "#1E3A8A", desc: "Tinta clásica de certificación" },
  { name: "Verde Esmeralda", hex: "#065F46", desc: "Sello botánico / natural" },
  { name: "Café Espresso", hex: "#451A03", desc: "Tono artesanal tostado" },
  { name: "Ámbar Dorado", hex: "#B45309", desc: "Edición especial y cálida" },
  { name: "Negro Carbón", hex: "#18181B", desc: "Impresión de alta densidad" },
  { name: "Violeta Diplomático", hex: "#581C87", desc: "Distinción y elegancia" },
];

// Iconos temáticos sugeridos
const THEMATIC_ICONS = [
  { icon: "☕", label: "Café" },
  { icon: "🥐", label: "Panadería" },
  { icon: "🍽️", label: "Restaurante" },
  { icon: "🍸", label: "Bar" },
  { icon: "🛍️", label: "Boutique" },
  { icon: "🏨", label: "Hotel" },
  { icon: "🏋️", label: "Gimnasio" },
  { icon: "✂️", label: "Barbería" },
  { icon: "📚", label: "Libros" },
  { icon: "🏛️", label: "Turismo" },
  { icon: "🎨", label: "Arte" },
  { icon: "⭐", label: "Premium" },
];

export const CommerceSello: React.FC = () => {
  const [sello, setSello] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [nombreSello, setNombreSello] = useState("");
  const [imagenSello, setImagenSello] = useState("☕");
  const [colorSello, setColorSello] = useState("#7C0A1E");
  const [descripcion, setDescripcion] = useState("");
  const [metaSellos, setMetaSellos] = useState(8);

  // Interactive stamping test effect
  const [isStamping, setIsStamping] = useState(false);

  const { showToast } = useUI();

  const loadSello = async () => {
    setLoading(true);
    try {
      const res = await api.get("/establishments/me/sello");
      const data = res.data?.data || res.data;
      if (data) {
        setSello(data);
        setNombreSello(data.nombre_sello || `Sello ${data.establecimiento_nombre || ""}`);
        setImagenSello(data.imagen_sello || "☕");
        setColorSello(data.color_sello || "#7C0A1E");
        setDescripcion(data.descripcion || "");
        setMetaSellos(data.meta_sellos || 8);
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || "No se pudo cargar tu sello digital", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSello();
  }, []);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen debe pesar menos de 5 MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const { data } = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.data?.url || data?.url;
      if (url) {
        setImagenSello(url);
        showToast("Imagen subida con éxito para tu sello", "success");
      }
    } catch {
      showToast("No se pudo subir la imagen", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreSello.trim()) {
      showToast("Ingresa un nombre para el sello", "error");
      return;
    }

    setSaving(true);
    try {
      await api.put("/establishments/me/sello", {
        nombre_sello: nombreSello.trim(),
        imagen_sello: imagenSello.trim(),
        color_sello: colorSello.trim(),
        descripcion: descripcion.trim(),
        meta_sellos: Number(metaSellos),
      });
      showToast("¡Diseño de sello digital guardado exitosamente!", "success");
      await loadSello();
    } catch (e: any) {
      showToast(e.response?.data?.message || "Error al guardar el sello", "error");
    } finally {
      setSaving(false);
    }
  };

  const triggerStampAnimation = () => {
    setIsStamping(true);
    setTimeout(() => {
      setIsStamping(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2">
        <Spinner size={36} />
        <p className="text-xs text-[#8E7D7D]">Cargando taller de sellos digitales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-[#7C0A1E]/20 text-[#7C0A1E] flex items-center justify-center font-bold shadow-xs">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D1A1E] font-serif">
                Mi Sello Digital
              </h1>
              <p className="text-xs text-[#8E7D7D]">
                Personaliza la insignia que se estampará en el pasaporte de tus clientes al validar su visita
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#EFE7DE] px-3.5 py-1.5 rounded-2xl shadow-2xs text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-[#2D1A1E]">
            {sello?.establecimiento_nombre || "Establecimiento"}
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
            {sello?.total_sellos_otorgados ?? 0} otorgados
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Panel de Diseño / Formulario */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE7DE] shadow-xs space-y-6">
          <div className="border-b border-[#EFE7DE] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2D1A1E] uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#7C0A1E]" />
              Atributos de Identidad del Sello
            </h3>
            <span className="text-[11px] text-[#8E7D7D]">Edición en vivo</span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Nombre del Sello */}
            <div>
              <Input
                label="Nombre del Sello *"
                placeholder="Ej. Sello Aroma Café"
                value={nombreSello}
                onChange={(e) => setNombreSello(e.target.value)}
                required
              />
              <span className="text-[11px] text-[#8E7D7D] block mt-1">
                Aparecerá en el registro de visitas y sellos coleccionados del cliente.
              </span>
            </div>

            {/* 2. Lema o Descripción */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Lema o Leyenda de Visita
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="Ej. Pasaporte Cafetero · Calidad de Origen"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <span className="text-[11px] text-[#8E7D7D] block mt-1">
                Mensaje conmemorativo que acompaña la acreditación del sello.
              </span>
            </div>

            {/* 3. Selección de Color de Tinta Digital */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-2">
                Color de Tinta Digital (Tono de Estampado)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INK_PALETTE.map((ink) => (
                  <button
                    key={ink.hex}
                    type="button"
                    onClick={() => setColorSello(ink.hex)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      colorSello.toLowerCase() === ink.hex.toLowerCase()
                        ? "border-[#7C0A1E] bg-[#FAF8F5] shadow-xs ring-2 ring-[#7C0A1E]/20"
                        : "border-[#EFE7DE] hover:border-slate-300"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-inner border border-black/10"
                      style={{ backgroundColor: ink.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#2D1A1E] truncate">{ink.name}</p>
                      <p className="text-[9px] text-[#8E7D7D] font-mono">{ink.hex}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selector personalizado */}
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={colorSello}
                  onChange={(e) => setColorSello(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-[#EFE7DE]"
                />
                <span className="text-xs text-[#8E7D7D]">
                  O elige un color personalizado: <strong className="font-mono text-[#2D1A1E]">{colorSello}</strong>
                </span>
              </div>
            </div>

            {/* 4. Insignia o Icono del Sello */}
            <div className="space-y-3 pt-2 border-t border-[#EFE7DE]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868]">
                  Insignia Central del Sello
                </label>
                <label className="cursor-pointer text-xs font-bold text-[#7C0A1E] hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir logo / insignia</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                </label>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-[#7C0A1E] bg-rose-50 p-2.5 rounded-xl border border-[#7C0A1E]/20">
                  <Spinner size={16} />
                  <span>Subiendo recurso gráfico...</span>
                </div>
              )}

              {/* Selector rápido de iconos temáticos */}
              <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
                {THEMATIC_ICONS.map((item) => (
                  <button
                    key={item.icon}
                    type="button"
                    onClick={() => setImagenSello(item.icon)}
                    className={`h-11 rounded-2xl border text-xl flex flex-col items-center justify-center transition-all ${
                      imagenSello === item.icon
                        ? "border-[#7C0A1E] bg-rose-50/60 shadow-xs ring-2 ring-[#7C0A1E]/20"
                        : "border-[#EFE7DE] hover:bg-[#FAF8F5]"
                    }`}
                    title={item.label}
                  >
                    <span>{item.icon}</span>
                  </button>
                ))}
              </div>

              {imagenSello.startsWith("http") && (
                <div className="flex items-center justify-between bg-[#FAF8F5] p-3 rounded-2xl border border-[#EFE7DE] text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <img src={imagenSello} alt="Logo" className="w-8 h-8 rounded-full object-contain" />
                    <span className="text-muted truncate text-[11px] font-mono">Logo personalizado cargado</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagenSello("☕")}
                    className="text-xs text-rose-600 hover:underline font-bold shrink-0 ml-2"
                  >
                    Restablecer
                  </button>
                </div>
              )}
            </div>

            {/* 5. Meta de sellos del ciclo */}
            <div className="pt-2 border-t border-[#EFE7DE]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#736868] mb-1">
                Meta de Sellos por Ciclo de Pasaporte
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={metaSellos}
                  onChange={(e) => setMetaSellos(Number(e.target.value))}
                  className="input-base w-32 font-bold text-center"
                />
                <span className="text-xs text-[#8E7D7D]">
                  sellos para que el cliente complete una ronda y desbloquee recompensas exclusivas
                </span>
              </div>
            </div>

            {/* Botón de Guardado */}
            <div className="pt-4 flex items-center gap-3">
              <Button type="submit" loading={saving} className="px-6 py-2.5 text-xs font-bold">
                <Save className="w-4 h-4 mr-2" />
                Guardar Diseño de Sello
              </Button>
              <button
                type="button"
                onClick={triggerStampAnimation}
                className="px-4 py-2.5 rounded-xl border border-[#EFE7DE] text-xs font-bold text-[#2D1A1E] hover:bg-[#FAF8F5] transition active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Simular Estampado</span>
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Vista Previa en Pasaporte del Cliente */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#EFE7DE]/50 border border-[#EFE7DE] p-4 rounded-3xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-[#7C0A1E] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Vista Previa en el Pasaporte
              </span>
              <span className="text-[10px] font-bold text-[#8E7D7D] bg-white px-2 py-0.5 rounded-full border border-[#EFE7DE]">
                Web App del Cliente
              </span>
            </div>

            {/* Hoja de Pasaporte Vintage con Fondo Crema y Filigranas */}
            <div className="relative bg-[#FAF8F5] border-2 border-[#D8C7B5] rounded-3xl p-6 shadow-md overflow-hidden min-h-[380px] flex flex-col justify-between">
              {/* Filigrana de pasaporte y guilloché */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, #7C0A1E 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#C5A059] via-[#7C0A1E] to-[#C5A059]" />

              {/* Header de la página del pasaporte */}
              <div className="relative z-10 flex items-center justify-between border-b border-[#E8DFD5] pb-2 text-[10px] text-[#8E7D7D] font-mono uppercase tracking-widest">
                <span>PASAPORTE DIGITAL · REPÚBLICA</span>
                <span>PÁG. 04</span>
              </div>

              {/* Sello Estampado Central */}
              <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center">
                <div
                  className={`transition-all duration-500 transform ${
                    isStamping ? "scale-125 opacity-40 blur-xs" : "scale-100 opacity-100"
                  }`}
                >
                  <DigitalStampBadge
                    nombre_sello={nombreSello}
                    establecimiento_nombre={sello?.establecimiento_nombre || "Establecimiento"}
                    imagen_sello={imagenSello}
                    color_sello={colorSello}
                    numero_sello={1}
                    fecha={new Date()}
                    size="lg"
                    rotation={-4}
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-bold text-[#2D1A1E]">
                    {nombreSello || "Sello Comercial"}
                  </p>
                  <p className="text-[11px] text-[#8E7D7D] italic mt-0.5 max-w-xs">
                    "{descripcion || "Visita confirmada en establecimiento afiliado"}"
                  </p>
                </div>
              </div>

              {/* Pie de página con código de autenticidad */}
              <div className="relative z-10 border-t border-[#E8DFD5] pt-2 flex items-center justify-between text-[9px] text-[#8E7D7D] font-mono">
                <span>NFC-VALIDATED · +{sello?.puntos_por_visita || 20} PTS</span>
                <span>ID: #SELLO-VRF-2026</span>
              </div>
            </div>
          </div>

          {/* Tarjeta explicativa para el comercio */}
          <div className="bg-white rounded-3xl p-5 border border-[#EFE7DE] shadow-2xs space-y-2.5 text-xs text-[#8E7D7D]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#2D1A1E] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                ¿Cómo funciona el Sello Digital?
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                +{sello?.puntos_por_visita || 20} pts / visita
              </span>
            </div>
            <p>
              Cada vez que acerques la tarjeta NFC de un cliente a tu terminal o registres su visita, este sello se estampará automáticamente en su pasaporte digital personal junto con los <strong>+{sello?.puntos_por_visita || 20} puntos</strong> configurados por la administración.
            </p>
            <p className="text-[11px]">
              Al completar los <strong>{metaSellos} sellos</strong> requeridos, tu cliente completará este ciclo y acumulará puntos para canjear recompensas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
