import { NivelNombre, User } from "../types";

/** Niveles alineados con pasaporte.sql */
export const NIVELES = [
  { nombre: "Bronce" as NivelNombre, sellos: 0, color: "#CE8946" },
  { nombre: "Plata" as NivelNombre, sellos: 20, color: "#C0C0C0" },
  { nombre: "Oro" as NivelNombre, sellos: 50, color: "#FFD700" },
  { nombre: "Diamante" as NivelNombre, sellos: 150, color: "#08cef1" },
];

export function normalizeNivel(n?: string | null): NivelNombre {
  const v = (n || "Bronce").toLowerCase();
  if (v.includes("plata")) return "Plata";
  if (v.includes("oro")) return "Oro";
  if (v.includes("diamante")) return "Diamante";
  return "Bronce";
}

export function getNivelInfo(user?: User | null) {
  const sellos = user?.total_sellos ?? 0;
  const actual =
    NIVELES.slice()
      .reverse()
      .find((n) => sellos >= n.sellos) || NIVELES[0];
  const idx = NIVELES.findIndex((n) => n.nombre === actual.nombre);
  const siguiente = NIVELES[idx + 1] || null;
  const base = actual.sellos;
  const techo = siguiente ? siguiente.sellos : actual.sellos;
  const progreso =
    siguiente && techo > base
      ? Math.min(100, Math.round(((sellos - base) / (techo - base)) * 100))
      : 100;
  const faltan = siguiente ? Math.max(0, siguiente.sellos - sellos) : 0;

  return {
    actual: (user?.nivel_nombre as NivelNombre) || actual.nombre,
    color: actual.color,
    sellos,
    puntos: user?.puntos_globales ?? 0,
    progreso,
    faltan,
    siguiente: siguiente?.nombre || null,
  };
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function initials(user?: Partial<User> | null): string {
  const a = (user?.nombres || user?.email || "?").charAt(0);
  const b = (user?.apellidos || "").charAt(0);
  return (a + b).toUpperCase() || "U";
}
