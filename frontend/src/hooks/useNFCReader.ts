import { useState, useCallback, useRef, useEffect } from "react";
export interface NFCScanResult {
  serialNumber: string;
  records: string[];
}
export const useNFCReader = () => {
  const [isScanning, setIsScanning] = useState(false),
    [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const isSupported = "NDEFReader" in window;
  const stopScan = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setIsScanning(false);
  }, []);
  useEffect(() => () => abort.current?.abort(), []);
  const startScan = useCallback(
    async (onTagRead: (result: NFCScanResult) => void) => {
      stopScan();
      setError(null);
      if (!isSupported || !window.isSecureContext) {
        setError(
          "NFC requiere HTTPS y un navegador/dispositivo compatible. Usa el QR como alternativa.",
        );
        return;
      }
      const controller = new AbortController();
      abort.current = controller;
      setIsScanning(true);
      try {
        const reader = new (window as any).NDEFReader();
        await reader.scan({ signal: controller.signal });
        reader.onreading = (event: any) => {
          if (controller.signal.aborted) return;
          const records = event.message.records
            .filter((r: any) => ["text", "url"].includes(r.recordType))
            .map((r: any) =>
              new TextDecoder(r.encoding || "utf-8").decode(r.data),
            );
          stopScan();
          onTagRead({ serialNumber: event.serialNumber, records });
        };
        reader.onreadingerror = () =>
          setError("No se pudo leer la etiqueta NDEF. Acércala nuevamente.");
      } catch (e: any) {
        if (e.name !== "AbortError")
          setError(
            e.name === "NotAllowedError"
              ? "Permiso NFC denegado. Revisa los permisos del navegador."
              : "No se pudo iniciar NFC. Comprueba que esté activado.",
          );
        if (abort.current === controller) stopScan();
      }
    },
    [isSupported, stopScan],
  );
  return { isScanning, isSupported, error, startScan, stopScan };
};
