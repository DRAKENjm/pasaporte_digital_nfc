/** Normaliza roles de BD / JWT (CLIENTE | COMERCIO | ADMIN) */
export type AppRole = "CLIENTE" | "COMERCIO" | "ADMIN";

export function normalizeRole(role?: string | null): AppRole {
  const r = (role || "").toUpperCase().trim();
  if (r === "ADMIN" || r === "ADMINISTRADOR") return "ADMIN";
  if (r === "COMERCIO" || r === "COMMERCE" || r === "EMPRESA" || r === "LOCAL")
    return "COMERCIO";
  return "CLIENTE";
}

export function homePathForRole(role?: string | null): string {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "/admin";
  if (r === "COMERCIO") return "/commerce";
  return "/user/home";
}

export function isRole(
  role: string | null | undefined,
  ...allowed: AppRole[]
): boolean {
  return allowed.includes(normalizeRole(role));
}
