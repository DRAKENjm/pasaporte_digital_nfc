import React, { useState } from "react";
import { Button } from "../common/Button";

interface Props {
  onRead: (uid: string) => void;
}

export const NFCScanner: React.FC<Props> = ({ onRead }) => {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const startScan = async () => {
    // @ts-ignore - Web NFC API
    if (!("NDEFReader" in window)) {
      setSupported(false);
      setError(
        "Web NFC no disponible en este navegador. Usa Chrome en Android.",
      );
      return;
    }
    setSupported(true);
    setScanning(true);
    setError("");
    try {
      // @ts-ignore
      const reader = new NDEFReader();
      await reader.scan();
      reader.onreading = (event: any) => {
        const serial = event.serialNumber || "UID_DESCONOCIDO";
        onRead(serial);
        setScanning(false);
      };
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar el escaneo NFC");
      setScanning(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={startScan} loading={scanning} className="w-full">
        {scanning ? "Acerca la tarjeta..." : "Escanear NFC"}
      </Button>
      {supported === false && <p className="text-xs text-amber-400">{error}</p>}
      {error && supported !== false && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};
