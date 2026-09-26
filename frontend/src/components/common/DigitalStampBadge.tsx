import React from "react";
import { Award, CheckCircle2 } from "lucide-react";

interface DigitalStampBadgeProps {
  nombre_sello?: string;
  establecimiento_nombre?: string;
  imagen_sello?: string;
  color_sello?: string;
  numero_sello?: number;
  fecha?: string | Date;
  size?: "sm" | "md" | "lg" | "xl";
  rotation?: number;
  interactive?: boolean;
}

export const DigitalStampBadge: React.FC<DigitalStampBadgeProps> = ({
  nombre_sello = "Sello Digital",
  establecimiento_nombre = "Local Afiliado",
  imagen_sello = "☕",
  color_sello = "#7C0A1E",
  numero_sello,
  fecha,
  size = "md",
  rotation = -3,
  interactive = false,
}) => {
  // Dimensiones según el tamaño
  const sizeMap = {
    sm: {
      box: "w-20 h-20",
      borderOuter: "border-2",
      borderInner: "border",
      textTop: "text-[7px]",
      textBottom: "text-[6px]",
      centerIcon: "text-lg",
      centerImg: "w-7 h-7",
      numberBadge: "text-[8px] px-1 py-0.2",
    },
    md: {
      box: "w-28 h-28",
      borderOuter: "border-2",
      borderInner: "border-[1.5px]",
      textTop: "text-[8.5px]",
      textBottom: "text-[7.5px]",
      centerIcon: "text-2xl",
      centerImg: "w-10 h-10",
      numberBadge: "text-[9px] px-1.5 py-0.5",
    },
    lg: {
      box: "w-36 h-36",
      borderOuter: "border-[3px]",
      borderInner: "border-2",
      textTop: "text-[10.5px]",
      textBottom: "text-[9px]",
      centerIcon: "text-3xl",
      centerImg: "w-14 h-14",
      numberBadge: "text-[10px] px-2 py-0.5",
    },
    xl: {
      box: "w-48 h-48",
      borderOuter: "border-4",
      borderInner: "border-2",
      textTop: "text-[13px]",
      textBottom: "text-[11px]",
      centerIcon: "text-5xl",
      centerImg: "w-20 h-20",
      numberBadge: "text-xs px-2.5 py-1",
    },
  };

  const s = sizeMap[size];
  const isImage =
    imagen_sello &&
    (imagen_sello.startsWith("http://") ||
      imagen_sello.startsWith("https://") ||
      imagen_sello.startsWith("/"));

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

      {/* 3. Centro: Insignia, Imagen o Icono con halo de tinta */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        {isImage ? (
          <img
            src={imagen_sello}
            alt={nombre_sello}
            className={`${s.centerImg} object-contain rounded-full filter drop-shadow-xs`}
            style={{
              // Efecto de colorizado de tinta suave si es png
              mixBlendMode: "multiply",
            }}
          />
        ) : (
          <span className={`${s.centerIcon} leading-none drop-shadow-xs`}>
            {imagen_sello || "☕"}
          </span>
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
    </div>
  );
};
