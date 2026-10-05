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
    async (
      onTagRead: (result: NFCScanResult) => void,
      options?: { autoStop?: boolean }
    ) => {
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
          const records = (event.message?.records || [])
            .filter((r: any) => ["text", "url"].includes(r.recordType))
            .map((r: any) =>
              new TextDecoder(r.encoding || "utf-8").decode(r.data),
            );
          if (options?.autoStop !== false) {
            stopScan();
          }
          onTagRead({ serialNumber: event.serialNumber, records });
        };
        reader.onreadingerror = () =>
          setError("No se pudo leer la etiqueta NDEF. Acércala nuevamente.");
      } catch (e: any) {
        if (e.name !== "AbortError") {
          let msg = "No se pudo iniciar el lector NFC.";
          if (e.name === "NotAllowedError") {
            msg = "Permiso NFC denegado en el navegador. Concede permisos para continuar.";
          } else if (e.name === "NotSupportedError") {
            msg = "Este dispositivo o navegador no cuenta con soporte de hardware NFC. Puedes usar el código QR o un lector USB.";
          } else if (e.name === "SecurityError") {
            msg = "NFC requiere una conexión segura (HTTPS) para funcionar en tu dispositivo.";
          } else {
            msg = "No se pudo iniciar NFC. Comprueba que tu celular tenga antena NFC física y que esté activada en los Ajustes del sistema.";
          }
          setError(msg);
        }
        if (abort.current === controller) stopScan();
      }
    },
    [isSupported, stopScan],
  );
  return { isScanning, isSupported, error, startScan, stopScan };
};
