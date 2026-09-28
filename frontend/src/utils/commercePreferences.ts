export type ReaderMode = "USB_NFC" | "WEB_NFC" | "MANUAL";
export interface CommercePreferences {
  modoLector: ReaderMode;
  sonidoLectura: boolean;
}

export const defaultCommercePreferences: CommercePreferences = {
  modoLector: "MANUAL",
  sonidoLectura: true,
};

export const isReaderMode = (value: unknown): value is ReaderMode =>
  value === "USB_NFC" || value === "WEB_NFC" || value === "MANUAL";

const storageKey = (userId: string) => `commerce:terminal:v1:${userId}`;

export function loadCommercePreferences(userId?: string): CommercePreferences {
  if (!userId) return { ...defaultCommercePreferences };
  try {
    const data = JSON.parse(localStorage.getItem(storageKey(userId)) || "null");
    return {
      modoLector: isReaderMode(data?.modoLector) ? data.modoLector : defaultCommercePreferences.modoLector,
      sonidoLectura: typeof data?.sonidoLectura === "boolean" ? data.sonidoLectura : defaultCommercePreferences.sonidoLectura,
    };
  } catch {
    return { ...defaultCommercePreferences };
  }
}

export function saveCommercePreferences(userId: string, preferences: CommercePreferences): void {
  if (!userId || !isReaderMode(preferences.modoLector) || typeof preferences.sonidoLectura !== "boolean") {
    throw new Error("Preferencias de terminal inválidas");
  }
  // Dejar que el formulario informe si el navegador bloquea el almacenamiento.
  localStorage.setItem(storageKey(userId), JSON.stringify(preferences));
}
