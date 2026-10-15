/**
 * Utilidades de cumplimiento con la Ley N° 29733 (Ley de Protección de Datos Personales - Perú).
 * Enmascara datos personales de contacto (PII) en pantallas operativas, paneles y reportes
 * para evitar la exposición indebida en capturas de pantalla, auditorías o compartición fuera del equipo.
 */

/**
 * Enmascara parcialmente un correo electrónico.
 * Ejemplo: hector.sanchez@gmail.com -> hec***@gmail.com
 * Ejemplo: juan@hotmail.com -> ju***@hotmail.com
 * Ejemplo: a@b.com -> a***@b.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "—";
  const trimmed = email.trim();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return trimmed;
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user.charAt(0)}***@${domain}`;
  }
  const prefix = user.slice(0, 3);
  return `${prefix}***@${domain}`;
}

/**
 * Enmascara parcialmente un número de teléfono o celular (Perú: 9 dígitos).
 * Ejemplo: 987654321 -> 987 *** 321
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "—";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 7) return phone;
  const start = clean.slice(0, 3);
  const end = clean.slice(-3);
  return `${start} *** ${end}`;
}

/**
 * Enmascara parcialmente un DNI o documento de identidad (Perú: 8 dígitos).
 * Ejemplo: 72345678 -> 72***678
 */
export function maskDocument(doc: string | null | undefined): string {
  if (!doc || typeof doc !== "string") return "—";
  const clean = doc.trim();
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
}
