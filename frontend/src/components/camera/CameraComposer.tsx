import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, SwitchCamera, Check, ImagePlus } from "lucide-react";
import { Button } from "../common/Button";

const FILTERS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "clarendon", label: "Clarendon", css: "contrast(1.2) saturate(1.35)" },
  {
    id: "gingham",
    label: "Gingham",
    css: "brightness(1.05) hue-rotate(-10deg)",
  },
  {
    id: "moon",
    label: "Moon",
    css: "grayscale(1) contrast(1.1) brightness(1.1)",
  },
  {
    id: "lark",
    label: "Lark",
    css: "contrast(0.9) brightness(1.1) saturate(1.2)",
  },
  {
    id: "reyes",
    label: "Reyes",
    css: "sepia(0.22) brightness(1.1) contrast(0.85)",
  },
  {
    id: "juno",
    label: "Juno",
    css: "contrast(1.15) saturate(1.4) hue-rotate(-5deg)",
  },
  {
    id: "valencia",
    label: "Valencia",
    css: "contrast(1.08) brightness(1.08) sepia(0.15)",
  },
];

export interface CameraResult {
  dataUrl: string;
  filter: string;
  caption: string;
  mode: "story" | "post";
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (result: CameraResult) => void | Promise<void>;
  defaultMode?: "story" | "post";
}

export const CameraComposer: React.FC<Props> = ({
  open,
  onClose,
  onCapture,
  defaultMode = "story",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [filter, setFilter] = useState("none");
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [mode, setMode] = useState<"story" | "post">(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const generation = useRef(0);

  const stopStream = useCallback(() => {
    generation.current++;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setReady(false);
    setError(null);
    const current = generation.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      if (current !== generation.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch {
      setError(
        "No se pudo acceder a la cámara. Revisa permisos del navegador o sube una imagen.",
      );
    }
  }, [facing, stopStream]);

  useEffect(() => {
    if (open && !preview) startCamera();
    if (!open) {
      stopStream();
      setPreview(null);
      setCaption("");
      setFilter("none");
    }
    return () => stopStream();
  }, [open, facing, preview, startCamera, stopStream]);

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const f = FILTERS.find((x) => x.id === filter)?.css || "none";
    ctx.filter = "none";
    // espejo si frontal
    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    setPreview(canvas.toDataURL("image/jpeg", 0.92));
    stopStream();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Selecciona JPEG, PNG o WebP de hasta 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      stopStream();
    };
    reader.readAsDataURL(file);
  };

  const confirm = async () => {
    if (!preview || saving) return;
    setSaving(true);
    setError(null);
    try {
      const img = new Image();
      img.src = preview;
      await img.decode();
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = FILTERS.find((f) => f.id === filter)?.css || "none";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      await onCapture({
        dataUrl: canvas.toDataURL("image/jpeg", 0.85),
        filter: "none",
        caption: caption.trim(),
        mode,
      });
      onClose();
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "No se pudo publicar. Tu imagen sigue disponible para reintentar.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const filterCss = FILTERS.find((x) => x.id === filter)?.css || "none";

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col max-w-2xl mx-auto">
      <header className="flex items-center justify-between px-3 py-2 safe-area-pt text-white">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex gap-1 bg-white/10 rounded-full p-1">
          <button
            type="button"
            onClick={() => setMode("story")}
            className={`px-3 py-1 text-xs font-semibold rounded-full ${mode === "story" ? "bg-white text-black" : ""}`}
          >
            Historia
          </button>
          <button
            type="button"
            onClick={() => setMode("post")}
            className={`px-3 py-1 text-xs font-semibold rounded-full ${mode === "post" ? "bg-white text-black" : ""}`}
          >
            Publicación
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            setFacing((f) => (f === "user" ? "environment" : "user"))
          }
          className="p-2 rounded-full hover:bg-white/10"
          aria-label="Cambiar cámara"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 relative bg-black overflow-hidden flex items-center justify-center">
        {!preview ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`max-h-full max-w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
              style={{ filter: filterCss === "none" ? undefined : filterCss }}
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/90 text-sm bg-black/70">
                {error}
              </div>
            )}
          </>
        ) : (
          <img
            src={preview}
            alt="Vista previa"
            className="max-h-full max-w-full object-contain"
            style={{ filter: filterCss === "none" ? undefined : filterCss }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <p role="alert" className="text-red-300 px-4 py-2 text-sm">
          {error}
        </p>
      )}
      {/* Filtros */}
      <div className="px-2 py-2 overflow-x-auto flex gap-2 bg-black/90">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border ${
              filter === f.id
                ? "bg-sky-500 border-sky-400 text-white"
                : "bg-white/10 border-white/20 text-white/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {preview && (
        <div className="px-3 pb-2">
          <input
            className="w-full rounded-xl bg-white/10 border border-white/20 text-white text-sm px-3 py-2.5 placeholder:text-white/40"
            placeholder="Escribe un pie de foto..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
          />
        </div>
      )}

      <footer className="px-4 py-4 safe-area-pb flex items-center justify-between gap-4 bg-black">
        <label className="p-3 rounded-full bg-white/10 text-white cursor-pointer">
          <ImagePlus className="w-5 h-5" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={onFile}
          />
        </label>

        {!preview ? (
          <button
            type="button"
            onClick={snap}
            disabled={!ready}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
          >
            <span className="w-12 h-12 rounded-full bg-white" />
          </button>
        ) : (
          <div className="flex gap-2 flex-1 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setPreview(null);
              }}
            >
              Repetir
            </Button>
            <Button onClick={confirm} loading={saving}>
              <Check className="w-4 h-4" />
              {mode === "story" ? "Publicar historia" : "Publicar"}
            </Button>
          </div>
        )}

        <div className="w-11" />
      </footer>
    </div>
  );
};
