/** Normaliza roles de BD / JWT (CLIENTE | COMERCIO | ADMIN) */
export type AppRole = "CLIENTE" | "COMERCIO" | "ADMIN";

export function normalizeRole(role?: string | null): AppRole {
  const r = (role || "").toUpperCase().trim();
  if (
    r === "ADMIN" ||
    r === "ADMINISTRADOR" ||
    r === "ADMIN_GENERAL" ||
    r === "SUPERADMIN"
  ) {
    return "ADMIN";
  }
  if (
    r === "COMERCIO" ||
    r === "COMMERCE" ||
    r === "EMPRESA" ||
    r === "LOCAL" ||
    r === "ADMIN_LOCAL" ||
    r === "TRABAJADOR_LOCAL"
  ) {
    return "COMERCIO";
  }
  return "CLIENTE";
}

export function homePathForRole(role?: string | null): string {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "/admin";
  if (r === "COMERCIO") return "/commerce/validar";
  return "/user/home";
}

export function isRole(
  role: string | null | undefined,
  ...allowed: AppRole[]
): boolean {
  return allowed.includes(normalizeRole(role));
}
