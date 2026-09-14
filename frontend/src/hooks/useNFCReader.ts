import { useState, useCallback } from 'react';

export interface NFCScanResult {
  serialNumber: string;
  records: string[];
}

export const useNFCReader = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported] = useState<boolean>(() => 'NDEFReader' in window);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async (onTagRead: (result: NFCScanResult) => void) => {
    if (!('NDEFReader' in window)) {
      setError('Web NFC no está soportado en este dispositivo/navegador. Usa QR como alternativa.');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      // @ts-ignore - NDEFReader is experimental in Web API
      const ndef = new window.NDEFReader();
      await ndef.scan();

      ndef.addEventListener('reading', ({ serialNumber, message }: any) => {
        const records: string[] = [];
        for (const record of message.records) {
          const decoder = new TextDecoder(record.encoding || 'utf-8');
          records.push(decoder.decode(record.data));
        }
        onTagRead({ serialNumber, records });
      });

      ndef.addEventListener('readingerror', () => {
        setError('Error al leer la tarjeta NFC. Acércala nuevamente.');
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo activar el lector NFC.');
      setIsScanning(false);
    }
  }, []);

  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  return { isScanning, isSupported, error, startScan, stopScan };
};
