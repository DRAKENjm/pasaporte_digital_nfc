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

  // Dimensiones según el tamaño
  const sizeMap = {
    sm: {
      box: "w-24 h-24",
      borderOuter: "border-2",
      borderInner: "border",
      textTop: "text-[7.5px]",
      textBottom: "text-[6.5px]",
      centerIcon: "text-xl",
      centerVector: "w-10 h-10",
      centerImg: "w-11 h-11 max-h-11",
      numberBadge: "text-[7.5px] px-1 py-0.2",
    },
    md: {
      box: "w-28 h-28",
      borderOuter: "border-[2px]",
      borderInner: "border-[1.5px]",
      textTop: "text-[9px]",
      textBottom: "text-[7.5px]",
      centerIcon: "text-3xl",
      centerVector: "w-13 h-13",
      centerImg: "w-14 h-14 max-h-14",
      numberBadge: "text-[8.5px] px-1.5 py-0.5",
    },
    lg: {
      box: "w-36 h-36",
      borderOuter: "border-[2.5px]",
      borderInner: "border-2",
      textTop: "text-[11px]",
      textBottom: "text-[9px]",
      centerIcon: "text-4xl",
      centerVector: "w-18 h-18",
      centerImg: "w-20 h-20 max-h-20",
      numberBadge: "text-[10px] px-2.5 py-0.5",
    },
    xl: {
      box: "w-48 h-48",
      borderOuter: "border-4",
      borderInner: "border-2",
      textTop: "text-[13.5px]",
      textBottom: "text-[11px]",
      centerIcon: "text-6xl",
      centerVector: "w-26 h-26",
      centerImg: "w-28 h-28 max-h-28",
      numberBadge: "text-xs px-3 py-1",
    },
    xxl: {
      box: "w-72 h-72",
      borderOuter: "border-4",
      borderInner: "border-[3px]",
      textTop: "text-[17px]",
      textBottom: "text-[13.5px]",
      centerIcon: "text-8xl",
      centerVector: "w-44 h-44",
      centerImg: "w-46 h-46 max-h-46",
      numberBadge: "text-sm px-3.5 py-1",
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

      {/* 2. Cabecera Curva o Superior del Sello */}
      <div className="absolute top-1.5 inset-x-0 text-center px-2 z-10">
        <span
          className={`font-black uppercase tracking-widest block truncate ${s.textTop} ${
            es_sello_especial ? "text-[#92400E] font-black" : "opacity-90"
          }`}
        >
          {es_sello_especial ? "★ META COMPLETADA ★" : establecimiento_nombre}
        </span>
      </div>

      {/* 3. Centro: Insignia, Imagen o Icono vectorial */}
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
              size={size === "sm" ? 22 : size === "md" ? 32 : size === "lg" ? 44 : 58}
            />
          </div>
        )}
      </div>

      {/* 4. Etiqueta Inferior: Número de Sello / Fecha / Corona de Certificación */}
      <div className="absolute bottom-1.5 inset-x-0 text-center px-1 z-10">
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
        ) : numero_sello ? (
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
            {subtitulo || "CERTIFICADO"}
          </span>
        )}
      </div>

      {/* 5. Marcas de Autenticidad Estrellas Laterales */}
      <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] ${es_sello_especial ? "text-[#D97706] font-bold" : "opacity-70"}`}>
        ★
      </span>
      <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] ${es_sello_especial ? "text-[#D97706] font-bold" : "opacity-70"}`}>
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
