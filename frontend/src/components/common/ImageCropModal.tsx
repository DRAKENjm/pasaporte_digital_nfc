import React, { useState, useRef, useEffect, useCallback } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Check,
  X,
  Sparkles,
  Crop as CropIcon,
} from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  title?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  title = "Ajustar Imagen del Sello",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Transform state
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  // Touch pinch zoom state
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef(1);

  const [processing, setProcessing] = useState(false);

  // Reset when a new image is loaded
  useEffect(() => {
    if (!open || !imageSrc) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      // Determine initial scale so the smallest dimension fills the aperture
      const containerSize = Math.min(window.innerWidth - 64, 320);
      const apertureRadius = containerSize * 0.42;
      const apertureDiameter = apertureRadius * 2;

      const scaleX = apertureDiameter / img.width;
      const scaleY = apertureDiameter / img.height;
      const baseScale = Math.max(scaleX, scaleY);

      setMinScale(baseScale * 0.8);
      setScale(baseScale * 1.1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      currentPos.current = { x: 0, y: 0 };
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  // Keep ref updated
  useEffect(() => {
    currentPos.current = position;
  }, [position]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      initialPinchDist.current = null;
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      isDragging.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      initialPinchDist.current = dist;
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    } else if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const factor = dist / initialPinchDist.current;
      const newScale = Math.min(5, Math.max(minScale, initialScale.current * factor));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    initialPinchDist.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(5, Math.max(minScale, prev + delta)));
  };

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Crop & Export
  const handleApplyCrop = () => {
    if (!image || !containerRef.current) return;
    setProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      const OUTPUT_SIZE = 600; // Alta resolución para sellos
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo inicializar el lienzo");

      // Circular crop clip
      ctx.beginPath();
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Clear
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Calculation of transformation relative to aperture size
      const containerRect = containerRef.current.getBoundingClientRect();
      const apertureSize = Math.min(containerRect.width, containerRect.height) * 0.84;
      const ratio = OUTPUT_SIZE / apertureSize;

      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * ratio, scale * ratio);
      ctx.translate(position.x / scale, position.y / scale);

      // Draw centered
      ctx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2,
        image.width,
        image.height,
      );
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          setProcessing(false);
          if (blob) {
            onCropComplete(blob);
          }
        },
        "image/png",
        0.95,
      );
    } catch (err) {
      console.error("Error al recortar imagen:", err);
      setProcessing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Mueve y ajusta el tamaño para que encaje perfectamente en el círculo central"
      size="md"
    >
      <div className="space-y-4 select-none">
        {/* Contenedor del Visor con Máscara Circular */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative w-full aspect-square max-h-[340px] sm:max-h-[380px] bg-slate-900 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center touch-none"
        >
          {/* Imagen transformable */}
          {image && (
            <img
              src={image.src}
              alt="Ajuste"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: "center center",
                maxWidth: "none",
              }}
              className="absolute pointer-events-none transition-transform duration-75"
            />
          )}

          {/* Máscara Circular de Abertura (Aperture Mask) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* SVG con recorte circular transparente y exterior oscuro */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <mask id="aperture-mask">
                  {/* Fondo blanco: opaco */}
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  {/* Círculo negro: transparente (abertura del sello) */}
                  <circle cx="50" cy="50" r="42" fill="black" />
                </mask>
              </defs>
              {/* Capa oscura exterior semitransparente */}
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="rgba(15, 23, 42, 0.72)"
                mask="url(#aperture-mask)"
              />
            </svg>

            {/* Borde del anillo guía central del sello */}
            <div className="absolute w-[84%] h-[84%] rounded-full border-2 border-white/90 border-dashed pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.1)] flex items-center justify-center">
              {/* Retícula sutil en cruz para ayudar a centrar */}
              <div className="w-2.5 h-2.5 border-t border-l border-white/70 absolute -top-1 -left-1" />
              <div className="w-2.5 h-2.5 border-t border-r border-white/70 absolute -top-1 -right-1" />
              <div className="w-2.5 h-2.5 border-b border-l border-white/70 absolute -bottom-1 -left-1" />
              <div className="w-2.5 h-2.5 border-b border-r border-white/70 absolute -bottom-1 -right-1" />
              
              {/* Punto centro sutil */}
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Pistas interactivas flotantes */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] bg-black/60 backdrop-blur-xs text-white/90 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 shadow-xs">
              <Move className="w-3 h-3" /> Arrastra para encuadrar · Pellizca para zoom
            </span>
          </div>
        </div>

        {/* Controles de Zoom y Rotación */}
        <div className="bg-[#FAF8F5] border border-[#EFE7DE] p-3 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#2D1A1E]">
            <span className="flex items-center gap-1.5 text-[#7C0A1E]">
              <CropIcon className="w-3.5 h-3.5" />
              Nivel de Zoom
            </span>
            <span className="font-mono text-[#8E7D7D]">{Math.round(scale * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(minScale, s - 0.2))}
              className="w-8 h-8 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] hover:bg-[#7C0A1E]/10 transition-colors cursor-pointer shrink-0"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={minScale}
              max={minScale * 3.5}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-[#7C0A1E] cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setScale((s) => Math.min(minScale * 3.5, s + 0.2))}
              className="w-8 h-8 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#7C0A1E] hover:bg-[#7C0A1E]/10 transition-colors cursor-pointer shrink-0"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="w-8 h-8 rounded-xl bg-white border border-[#EFE7DE] flex items-center justify-center text-[#2D1A1E] hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
              title="Girar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleApplyCrop}
            loading={processing}
            disabled={!image}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              Guardar y Aplicar al Sello
            </span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={processing}
          >
            <span className="flex items-center justify-center gap-1.5">
              <X className="w-4 h-4" />
              Cancelar
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
