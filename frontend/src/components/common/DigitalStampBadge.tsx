import React, { useState, useEffect } from "react";
import { Crown } from "lucide-react";
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
  es_sello_especial?: boolean;
  subtitulo?: string;
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
  es_sello_especial = false,
  subtitulo,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imagen_sello]);

  // Si es sello especial dorado, usamos paleta dorada de certificación consular
  const activeColor = es_sello_especial ? "#B45309" : color_sello;

  // Función auxiliar para adaptar el tamaño y espaciado del texto según la longitud del nombre del local (evita "...")
  const getTopTextConfig = (
    text: string,
    badgeSize: "sm" | "md" | "lg" | "xl" | "xxl"
  ) => {
    const len = text.length;

    switch (badgeSize) {
      case "sm":
        if (len > 20) return { textClass: "text-[5.5px] tracking-tight leading-none", maxLines: 2 };
        if (len > 14) return { textClass: "text-[6px] tracking-tight leading-tight", maxLines: 1 };
        if (len > 9) return { textClass: "text-[6.5px] tracking-normal leading-tight", maxLines: 1 };
        return { textClass: "text-[7.5px] tracking-wider leading-tight", maxLines: 1 };

      case "md":
        if (len > 24) return { textClass: "text-[6px] tracking-tight leading-none", maxLines: 2 };
        if (len > 15) return { textClass: "text-[7px] tracking-tight leading-tight", maxLines: 1 };
        if (len > 10) return { textClass: "text-[7.5px] tracking-normal leading-tight", maxLines: 1 };
        return { textClass: "text-[8.5px] tracking-widest leading-tight", maxLines: 1 };

      case "lg":
        if (len > 26) return { textClass: "text-[7.5px] tracking-tight leading-none", maxLines: 2 };
        if (len > 18) return { textClass: "text-[8.5px] tracking-tight leading-tight", maxLines: 1 };
        if (len > 12) return { textClass: "text-[9.5px] tracking-normal leading-tight", maxLines: 1 };
        return { textClass: "text-[11px] tracking-wider leading-tight", maxLines: 1 };

      case "xl":
        if (len > 28) return { textClass: "text-[9.5px] tracking-tight leading-none", maxLines: 2 };
        if (len > 20) return { textClass: "text-[11px] tracking-normal leading-tight", maxLines: 1 };
        if (len > 13) return { textClass: "text-[12px] tracking-normal leading-tight", maxLines: 1 };
        return { textClass: "text-[13.5px] tracking-widest leading-tight", maxLines: 1 };

      case "xxl":
      default:
        if (len > 30) return { textClass: "text-[11px] sm:text-[12px] tracking-tight leading-none", maxLines: 2 };
        if (len > 20) return { textClass: "text-[12px] sm:text-[13px] tracking-tight leading-tight", maxLines: 1 };
        if (len > 13) return { textClass: "text-[13px] sm:text-[14px] tracking-wider leading-tight", maxLines: 1 };
        return { textClass: "text-[14px] sm:text-[15px] tracking-widest leading-tight", maxLines: 1 };
    }
  };

  // Dimensiones según el tamaño (Aro exterior + Círculo central equilibrado en proporción áurea clásica de sellos: ~50% centro, ~25% aro a cada lado)
  const sizeMap = {
    sm: {
      box: "w-24 h-24",
      borderOuter: "border-2",
      borderInner: "border",
      centerDisk: "w-11 h-11",
      centerVector: "w-6 h-6",
      catIconSize: 22,
      numberBadge: "text-[7.5px] px-1 py-0.2",
      topOffset: "top-1 px-2",
      bottomOffset: "bottom-1 px-1",
    },
    md: {
      box: "w-28 h-28",
      borderOuter: "border-[2px]",
      borderInner: "border-[1.5px]",
      centerDisk: "w-13 h-13",
      centerVector: "w-7 h-7",
      catIconSize: 26,
      numberBadge: "text-[8.5px] px-1.5 py-0.5",
      topOffset: "top-1.5 px-2.5",
      bottomOffset: "bottom-1.5 px-1",
    },
    lg: {
      box: "w-36 h-36",
      borderOuter: "border-[2.5px]",
      borderInner: "border-2",
      centerDisk: "w-17 h-17",
      centerVector: "w-9 h-9",
      catIconSize: 34,
      numberBadge: "text-[10px] px-2.5 py-0.5",
      topOffset: "top-2 px-3",
      bottomOffset: "bottom-2 px-1",
    },
    xl: {
      box: "w-48 h-48",
      borderOuter: "border-4",
      borderInner: "border-2",
      centerDisk: "w-24 h-24",
      centerVector: "w-13 h-13",
      catIconSize: 48,
      numberBadge: "text-xs px-3 py-1",
      topOffset: "top-2.5 px-4",
      bottomOffset: "bottom-2.5 px-1.5",
    },
    xxl: {
      box: "w-64 h-64 sm:w-72 sm:h-72",
      borderOuter: "border-4",
      borderInner: "border-[3px]",
      centerDisk: "w-32 h-32 sm:w-36 sm:h-36",
      centerVector: "w-18 h-18 sm:w-20 sm:h-20",
      catIconSize: 68,
      numberBadge: "text-xs px-3 py-0.5",
      topOffset: "top-3 sm:top-3.5 px-5 sm:px-6",
      bottomOffset: "bottom-3 sm:bottom-3.5 px-2",
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

  const rawTitle =
    (establecimiento_nombre &&
     establecimiento_nombre !== "Local Afiliado" &&
     establecimiento_nombre !== "Establecimiento" &&
     establecimiento_nombre !== "Lugar")
      ? establecimiento_nombre
      : (nombre_sello || establecimiento_nombre || "Sello Oficial");
  const topTitle = es_sello_especial ? "★ META COMPLETADA ★" : rawTitle;
  const { textClass: topTextClass, maxLines: topMaxLines } = getTopTextConfig(topTitle, size);

  return (
    <div
      style={{
        transform: `rotate(${rotation}deg)`,
        color: activeColor,
        borderColor: activeColor,
      }}
      className={`
        ${s.box} relative select-none rounded-full flex flex-col items-center justify-center
        transition-all duration-300 shrink-0
        ${es_sello_especial ? "drop-shadow-[0_4px_14px_rgba(217,119,6,0.35)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]"}
        ${interactive ? "hover:scale-105 hover:rotate-0 cursor-pointer" : ""}
      `}
    >
      {/* 1. Anillo Exterior Notarial / Dentado de Seguridad */}
      {es_sello_especial ? (
        <>
          {/* Aureola Dorada */}
          <div
            className="absolute -inset-1 rounded-full opacity-30 blur-xs pointer-events-none"
            style={{ backgroundColor: "#F59E0B" }}
          />
          {/* Aro exterior doble dentado */}
          <div
            style={{ borderColor: "#D97706" }}
            className={`absolute inset-0 rounded-full ${s.borderOuter} border-double opacity-95`}
          />
          <div
            style={{ borderColor: "#F59E0B" }}
            className={`absolute inset-1.5 rounded-full ${s.borderInner} border-dotted opacity-90`}
          />
        </>
      ) : (
        <>
          <div
            style={{ borderColor: color_sello }}
            className={`absolute inset-0 rounded-full ${s.borderOuter} opacity-85 border-dashed`}
          />
          <div
            style={{ borderColor: color_sello }}
            className={`absolute inset-1 rounded-full ${s.borderInner} opacity-90`}
          />
          <div
            style={{ borderColor: color_sello }}
            className="absolute inset-2.5 rounded-full border border-dotted opacity-40 pointer-events-none"
          />
        </>
      )}

      {/* 2. Cabecera Superior del Sello con Adaptación Dinámica al Nombre (Sin "...") */}
      <div className={`absolute ${s.topOffset} inset-x-0 text-center z-20 flex items-center justify-center pointer-events-none`}>
        <span
          className={`font-black uppercase break-words block ${topTextClass} ${
            topMaxLines > 1 ? "line-clamp-2" : "truncate max-w-[92%]"
          } ${es_sello_especial ? "text-[#92400E]" : "opacity-95"}`}
          title={topTitle}
        >
          {topTitle}
        </span>
      </div>

      {/* 3. Centro: Medallón Circular Adaptativo Inteligente para Imagen o Icono */}
      <div className="relative z-10 flex items-center justify-center my-auto">
        <div
          style={{ borderColor: activeColor }}
          className={`
            ${s.centerDisk} rounded-full flex items-center justify-center overflow-hidden
            border border-current/25 bg-white/45 backdrop-blur-[1px]
            shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]
            transition-transform duration-300
          `}
        >
          {isImage ? (
            <img
              src={resolvedImg}
              alt={nombre_sello}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain object-center p-1 transition-transform duration-300 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
              style={{
                mixBlendMode: "multiply",
                opacity: 0.95,
              }}
            />
          ) : StampIcon ? (
            <StampIcon
              className={`${s.centerVector} drop-shadow-xs transition-transform`}
              strokeWidth={es_sello_especial ? 2 : 1.7}
            />
          ) : (
            <div
              className="flex items-center justify-center drop-shadow-xs"
              style={{ color: activeColor }}
            >
              <CategoryIcon
                icon={imagen_sello || "coffee"}
                size={s.catIconSize}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Etiqueta Inferior: Número de Sello / Fecha / Corona de Certificación */}
      <div className={`absolute ${s.bottomOffset} inset-x-0 text-center z-20 pointer-events-none`}>
        {es_sello_especial ? (
          <span
            style={{
              backgroundColor: "#FEF3C7",
              borderColor: "#D97706",
              color: "#92400E",
            }}
            className={`inline-block font-black uppercase tracking-widest rounded-md border shadow-2xs ${s.numberBadge}`}
          >
            SELLO DORADO
          </span>
        ) : formattedDate ? (
          <span
            style={{
              backgroundColor: `${color_sello}15`,
              borderColor: `${color_sello}35`,
              color: color_sello,
            }}
            className={`inline-block font-mono font-black uppercase tracking-wider rounded-md border ${s.numberBadge}`}
          >
            {formattedDate}
          </span>
        ) : (
          <span
            style={{
              backgroundColor: `${color_sello}15`,
              borderColor: `${color_sello}35`,
              color: color_sello,
            }}
            className={`inline-block font-mono font-black uppercase tracking-widest rounded-md border ${s.numberBadge}`}
          >
            {subtitulo || "★ CERTIFICADO ★"}
          </span>
        )}
      </div>

      {/* 5. Marcas de Autenticidad Estrellas Laterales */}
      <span className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] ${es_sello_especial ? "text-[#D97706] font-bold" : "opacity-70"}`}>
        ★
      </span>
      <span className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] ${es_sello_especial ? "text-[#D97706] font-bold" : "opacity-70"}`}>
        ★
      </span>

      {/* 6. Insignia Especial Dorada en Esquina */}
      {es_sello_especial && (
        <div
          title="¡Sello especial conmemorativo por completar la cartilla!"
          className="absolute -top-1.5 -left-1.5 z-20 w-6 h-6 rounded-full bg-gradient-to-tr from-[#B45309] to-[#F59E0B] text-white flex items-center justify-center shadow-md border border-white animate-pulse"
        >
          <Crown className="w-3.5 h-3.5 text-amber-100 drop-shadow-sm" />
        </div>
      )}

      {/* 7. Insignia de Colección Multiplicador (ej. x2, x5) */}
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
