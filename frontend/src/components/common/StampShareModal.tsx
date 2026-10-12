import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import {
  Share2,
  Download,
  Copy,
  Check,
} from "lucide-react";
import {
  generatePassportCardBlob,
  sharePassportCard,
  StampShareData,
  StampCardTheme,
} from "../../utils/shareStampCard";
import { useUI } from "../../hooks/useUI";

interface StampShareModalProps {
  open: boolean;
  onClose: () => void;
  data: StampShareData | null;
}

const THEME_OPTIONS: { id: StampCardTheme; name: string; desc: string; color: string }[] = [
  {
    id: "dark",
    name: "Edición Noche",
    desc: "Carbón Obsidiana y Oro",
    color: "#0F0F12",
  },
  {
    id: "blush",
    name: "Rosa Boutique",
    desc: "Rubí y Oro Champán",
    color: "#FFE4E8",
  },
  {
    id: "heritage",
    name: "Pasaporte Clásico",
    desc: "Crema Marfil y Borgoña",
    color: "#FAF8F5",
  },
];

export const StampShareModal: React.FC<StampShareModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const { showToast } = useUI();
  const [selectedTheme, setSelectedTheme] = useState<StampCardTheme>("dark");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !data) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    let isCancelled = false;
    setGenerating(true);

    generatePassportCardBlob(data, selectedTheme)
      .then((blob) => {
        if (isCancelled) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Error al generar tarjeta:", err);
          showToast("Error al generar la tarjeta visual", "error");
        }
      })
      .finally(() => {
        if (!isCancelled) setGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [open, data, selectedTheme]);

  if (!data) return null;

  const handleShareUniversal = async () => {
    setSharing(true);
    try {
      const res = await sharePassportCard(data, selectedTheme);
      if (res.shared) {
        showToast("¡Tarjeta compartida con éxito!", "success");
      } else {
        showToast("Imagen descargada para compartir en tus estados o aplicaciones", "success");
      }
    } catch {
      showToast("No se pudo compartir la tarjeta", "error");
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `tarjeta-${selectedTheme}-${data.nombreEstablecimiento.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    showToast("Tarjeta en alta resolución descargada", "success");
  };

  const handleCopyLink = () => {
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const shareText = data.sellosObtenidos > 0
      ? `¡Mira mi progreso en ${data.nombreEstablecimiento}! Llevo ${data.sellosObtenidos} de ${data.metaSellos} sellos en mi Pasaporte Digital. Colecciona tus sellos aquí: ${currentOrigin}`
      : `¡Descubre ${data.nombreEstablecimiento}! Visita lugares increíbles, acumula sellos oficiales y gana premios con tu Pasaporte Digital. Conoce más aquí: ${currentOrigin}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    showToast("Enlace y mensaje copiados al portapapeles", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tarjeta Digital de Fidelización"
      size="lg"
    >
      <div className="space-y-4">
        {/* Selector de Estilo / Tema en Español */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E7D7D] mb-2 text-center">
            Selecciona el estilo de tu tarjeta para compartir
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {THEME_OPTIONS.map((t) => {
              const isSelected = selectedTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTheme(t.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? "ring-2 ring-[#7C0A1E] shadow-sm bg-white border-[#7C0A1E]"
                      : "bg-[#FAF8F5] border-[#EFE7DE] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs font-black text-[#2D1A1E] truncate">
                      {t.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8E7D7D] line-clamp-1 leading-tight">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vista previa en tamaño grande, alto y nítido */}
        <div className="bg-[#121214] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[480px] max-h-[580px] shadow-inner">
          {generating ? (
            <div className="flex flex-col items-center gap-3 py-28 text-center">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-amber-200">
                Diseñando tarjeta en alta resolución...
              </span>
            </div>
          ) : previewUrl ? (
            <div className="flex flex-col items-center w-full">
              <img
                src={previewUrl}
                alt="Tarjeta Digital del Local"
                className="max-h-[490px] sm:max-h-[520px] w-auto rounded-2xl shadow-2xl border border-white/20 object-contain transition-transform hover:scale-[1.01]"
              />
              <span className="text-[10.5px] text-zinc-400 mt-2 font-mono">
                Sello Oficial del Local • Formato Vertical HD (1080 × 1540)
              </span>
            </div>
          ) : (
            <div className="text-xs text-zinc-400">No se pudo cargar la vista previa</div>
          )}
        </div>

        {/* Botones de acción principales */}
        <div className="space-y-2 pt-1">
          {/* Botón Compartir universal (WhatsApp, Estados, Instagram, etc.) */}
          <button
            type="button"
            onClick={handleShareUniversal}
            disabled={generating || sharing}
            className="w-full py-3.5 px-4 rounded-xl bg-[#7C0A1E] hover:bg-[#620616] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Share2 size={17} />
            <span>Compartir Tarjeta</span>
          </button>

          {/* Opciones secundarias */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !previewUrl}
              className="py-2.5 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#E5DACD] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={14} className="text-[#7C0A1E]" />
              <span>Guardar en Galería</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#E5DACD] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-[#7C0A1E]" />
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
