import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Share2, Download, Check, Sparkles, Image as ImageIcon } from "lucide-react";
import {
  generatePassportCardBlob,
  sharePassportCard,
  StampShareData,
} from "../../utils/shareStampCard";
import { useUI } from "../../hooks/useUI";

interface StampShareModalProps {
  open: boolean;
  onClose: () => void;
  data: StampShareData | null;
}

export const StampShareModal: React.FC<StampShareModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const { showToast } = useUI();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open && data) {
      setGenerating(true);
      generatePassportCardBlob(data)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        })
        .catch(() => {
          showToast("Error al generar la tarjeta visual", "error");
        })
        .finally(() => {
          setGenerating(false);
        });
    } else {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [open, data]);

  if (!data) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      await sharePassportCard(data);
      showToast("¡Tarjeta generada para compartir!", "success");
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
    a.download = `pasaporte-${data.nombreEstablecimiento.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    showToast("Imagen descargada", "success");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compartir Pasaporte de Sellos"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-[#8E7D7D] text-center">
          Comparte tu progreso y colección de sellos como una imagen oficial para WhatsApp y redes sociales.
        </p>

        {/* Vista previa de la tarjeta */}
        <div className="bg-[#FAF8F5] border border-[#EFE7DE] rounded-2xl p-2 flex justify-center items-center overflow-hidden min-h-[340px]">
          {generating ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-[#7C0A1E] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-[#7C0A1E]">Generando tarjeta gráfica...</span>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Tarjeta Pasaporte"
              className="max-h-[380px] w-auto rounded-xl shadow-lg border border-[#E5DACD] object-contain"
            />
          ) : (
            <div className="text-xs text-[#8E7D7D]">No se pudo cargar la vista previa</div>
          )}
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <Button
            variant="primary"
            onClick={handleShare}
            loading={sharing || generating}
            fullWidth
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir Imagen
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={generating || !previewUrl}
            fullWidth
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Imagen
          </Button>
        </div>
      </div>
    </Modal>
  );
};
