import React from "react";

export type NivelPasaporte = "Bronce" | "Plata" | "Oro" | "Diamante" | string;

interface Props {
  nivel?: NivelPasaporte | null;
  className?: string;
  size?: "sm" | "md";
}

const normalize = (
  n?: string | null,
): "bronce" | "plata" | "oro" | "diamante" => {
  const v = (n || "Bronce").toLowerCase().trim();
  if (v.includes("plata") || v === "silver") return "plata";
  if (v.includes("oro") || v === "gold") return "oro";
  if (v.includes("diamante") || v === "diamond") return "diamante";
  return "bronce";
};

const labels: Record<string, string> = {
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
  diamante: "Diamante",
};

const icons: Record<string, string> = {
  bronce: "🥉",
  plata: "🥈",
  oro: "🥇",
  diamante: "💎",
};

export const LevelBadge: React.FC<Props> = ({
  nivel,
  className = "",
  size = "md",
}) => {
  const key = normalize(nivel);
  const sizeCls =
    size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`level-badge level-${key} ${sizeCls} ${className}`}
      title={`Nivel ${labels[key]}`}
    >
      <span aria-hidden>{icons[key]}</span>
      <span>{labels[key]}</span>
    </span>
  );
};
