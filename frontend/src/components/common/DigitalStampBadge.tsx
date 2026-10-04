import React, { useState, useEffect } from "react";
import { CategoryIcon } from "./CategoryIcon";
import { getStampIcon } from "../../utils/stampIcons";

export const resolveImageUrl = (path?: string | null): string => {
  if (!path) return "";
  const trimmed = path.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;
  if (/\.(jpg|jpeg|png|webp|svg|gif|avif)($|\?)/i.test(trimmed)) {
    return `/uploads/${trimmed}`;
  }
  return trimmed;
};

export const isImageUrl = (val?: string | null): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("uploads/")
  ) {
    return true;
  }
  return /\.(jpg|jpeg|png|webp|svg|gif|avif)($|\?)/i.test(trimmed);
};

interface DigitalStampBadgeProps {
  nombre_sello?: string;
  establecimiento_nombre?: string;
  imagen_sello?: string;
  color_sello?: string;
  numero_sello?: number;
  contador?: number;
  fecha?: string | Date;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  rotation?: number;
  interactive?: boolean;
}

export const DigitalStampBadge: React.FC<DigitalStampBadgeProps> = ({
  nombre_sello = "Sello Digital",
  establecimiento_nombre = "Local Afiliado",
  imagen_sello = "landmark",
  color_sello = "#7C0A1E",
  numero_sello,
  contador,
  fecha,
  size = "md",
  rotation = -3,
  interactive = false,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imagen_sello]);

  // Dimensiones según el tamaño
  const sizeMap = {
    sm: {
      box: "w-24 h-24",
      borderOuter: "border-2",
      borderInner: "border",
      textTop: "text-[7px]",
      textBottom: "text-[6px]",
      centerIcon: "text-xl",
      centerVector: "w-13 h-13",
      centerImg: "w-14 h-14 max-h-14",
      numberBadge: "text-[8px] px-1 py-0.2",
    },
    md: {
      box: "w-28 h-28",
      borderOuter: "border-2",
      borderInner: "border-[1.5px]",
      textTop: "text-[8.5px]",
      textBottom: "text-[7.5px]",
      centerIcon: "text-3xl",
      centerVector: "w-16 h-16",
      centerImg: "w-17 h-17 max-h-17",
      numberBadge: "text-[9px] px-1.5 py-0.5",
    },
    lg: {
      box: "w-36 h-36",
      borderOuter: "border-[3px]",
      borderInner: "border-2",
      textTop: "text-[10.5px]",
      textBottom: "text-[9px]",
      centerIcon: "text-4xl",
      centerVector: "w-22 h-22",
      centerImg: "w-24 h-24 max-h-24",
      numberBadge: "text-[10px] px-2 py-0.5",
    },
    xl: {
      box: "w-48 h-48",
      borderOuter: "border-4",
      borderInner: "border-2",
      textTop: "text-[13px]",
      textBottom: "text-[11px]",
      centerIcon: "text-6xl",
      centerVector: "w-32 h-32",
      centerImg: "w-34 h-34 max-h-34",
      numberBadge: "text-xs px-2.5 py-1",
    },
    xxl: {
      box: "w-72 h-72",
      borderOuter: "border-4",
      borderInner: "border-[3px]",
      textTop: "text-[16px]",
      textBottom: "text-[13px]",
      centerIcon: "text-8xl",
      centerVector: "w-52 h-52",
      centerImg: "w-52 h-52 max-h-52",
      numberBadge: "text-sm px-3 py-1",
    },
  };

  const s = sizeMap[size];
  const isImage = isImageUrl(imagen_sello) && !imgError;
  const resolvedImg = resolveImageUrl(imagen_sello);

  const cleanIcon = (imagen_sello || "").trim().toLowerCase();
  const StampIcon =
    getStampIcon(imagen_sello) ||
    getStampIcon(`icon:${cleanIcon}`) ||
    getStampIcon(cleanIcon);

  const formattedDate = fecha
    ? new Date(fecha).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      style={{
        transform: `rotate(${rotation}deg)`,
        color: color_sello,
        borderColor: color_sello,
      }}
      className={`
        ${s.box} relative select-none rounded-full flex flex-col items-center justify-center
        transition-all duration-300 shrink-0
        ${interactive ? "hover:scale-105 hover:rotate-0 cursor-pointer" : ""}
      `}
    >
      {/* 1. Aro Exterior Doble Estilo Tinta Notarial / Passport Rubber Stamp */}
      <div
        style={{ borderColor: color_sello }}
        className={`absolute inset-0 rounded-full ${s.borderOuter} opacity-85 border-dashed`}
      />
      <div
        style={{ borderColor: color_sello }}
        className={`absolute inset-1 rounded-full ${s.borderInner} opacity-90`}
      />

      {/* 2. Cabecera Curva o Superior del Sello */}
      <div className="absolute top-1.5 inset-x-0 text-center px-2">
        <span
          className={`font-black uppercase tracking-widest block truncate ${s.textTop} opacity-90`}
        >
          {establecimiento_nombre}
        </span>
      </div>

      {/* 3. Centro: Insignia, Imagen o Icono vectorial con tinta notarial */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full px-2">
        {isImage ? (
          <img
            src={resolvedImg}
            alt={nombre_sello}
            onError={() => setImgError(true)}
            className={`${s.centerImg} object-contain rounded-full transition-transform duration-300 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]`}
            style={{
              mixBlendMode: "multiply",
              opacity: 0.95,
            }}
          />
        ) : StampIcon ? (
          <StampIcon className={`${s.centerVector} drop-shadow-xs`} strokeWidth={1.6} />
        ) : (
          <div
            className="flex items-center justify-center drop-shadow-xs"
            style={{ color: color_sello }}
          >
            <CategoryIcon
              icon={imagen_sello || "coffee"}
              size={size === "sm" ? 22 : size === "md" ? 34 : size === "lg" ? 46 : 60}
            />
          </div>
        )}
      </div>

      {/* 4. Etiqueta de Número de Sello / Fecha */}
      <div className="absolute bottom-1.5 inset-x-0 text-center px-1">
        {numero_sello ? (
          <span
            style={{
              backgroundColor: `${color_sello}15`,
              borderColor: `${color_sello}40`,
              color: color_sello,
            }}
            className={`inline-block font-black uppercase tracking-wider rounded-md border ${s.numberBadge}`}
          >
            Sello #{numero_sello}
          </span>
        ) : formattedDate ? (
          <span className={`font-mono font-bold uppercase tracking-wider opacity-80 ${s.textBottom}`}>
            {formattedDate}
          </span>
        ) : (
          <span
            className={`font-mono font-black uppercase tracking-widest block truncate opacity-75 ${s.textBottom}`}
          >
            CERTIFICADO
          </span>
        )}
      </div>

      {/* 5. Marca de Autenticidad Estrellas Laterales */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] opacity-70">
        ★
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] opacity-70">
        ★
      </span>

      {/* 6. Insignia de Colección Multiplicador (ej. x2, x5, x20) */}
      {contador && contador > 1 && (
        <div
          title={`${contador} sellos acumulados en este local`}
          className="absolute -top-2 -right-2 z-20 min-w-6 h-6 px-1.5 rounded-full bg-gradient-to-r from-[#7C0A1E] to-[#9B1B30] text-white font-black text-[10px] sm:text-xs flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-[#C5A059]/40 animate-fadeIn"
        >
          x{contador}
        </div>
      )}
    </div>
  );
};
