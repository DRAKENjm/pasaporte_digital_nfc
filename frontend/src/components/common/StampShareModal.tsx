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
      title="Tarjeta Digital"
      size="sm"
      bodyClassName="p-3.5 sm:p-4"
    >
      <div className="space-y-3">
        {/* Selector de Estilo / Tema compacto */}
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#8E7D7D] mb-1.5 text-center">
            Estilo de tarjeta
          </label>
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#EFE7DE]">
            {THEME_OPTIONS.map((t) => {
              const isSelected = selectedTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTheme(t.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#7C0A1E] shadow-xs border border-[#E5DACD]"
                      : "text-[#6E5D53] hover:text-[#2D1A1E]"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate text-[11px] sm:text-xs">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vista previa en tamaño proporcionado y nítido para móvil */}
        <div className="bg-[#121214] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center relative overflow-hidden h-[240px] sm:h-[270px] shadow-inner">
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-semibold text-amber-200">
                Diseñando tarjeta HD...
              </span>
            </div>
          ) : previewUrl ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <img
                src={previewUrl}
                alt="Tarjeta Digital del Local"
                className="max-h-[220px] sm:max-h-[250px] w-auto rounded-xl shadow-lg border border-white/15 object-contain"
              />
            </div>
          ) : (
            <div className="text-xs text-zinc-400">No se pudo cargar la vista previa</div>
          )}
        </div>

        {/* Botones de acción accesibles de un solo vistazo */}
        <div className="space-y-2 pt-0.5">
          {/* Botón Compartir universal (WhatsApp, Redes) */}
          <button
            type="button"
            onClick={handleShareUniversal}
            disabled={generating || sharing}
            className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl bg-[#7C0A1E] hover:bg-[#620616] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Share2 size={16} />
            <span>Compartir Tarjeta</span>
          </button>

          {/* Opciones secundarias: Guardar en Galería y Copiar Enlace */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !previewUrl}
              className="py-2 px-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#E5DACD] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={13} className="text-[#7C0A1E]" />
              <span className="truncate">Guardar en galería</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2 px-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#E5DACD] text-[#2D1A1E] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 truncate">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-[#7C0A1E]" />
                  <span className="truncate">Copiar enlace</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
