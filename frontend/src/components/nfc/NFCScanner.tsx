import React from 'react';
import { useNFCReader } from '../../hooks/useNFCReader';

interface NFCScannerProps {
  onScanSuccess: (tagId: string) => void;
}

export const NFCScanner: React.FC<NFCScannerProps> = ({ onScanSuccess }) => {
  const { isScanning, isSupported, error, startScan, stopScan } = useNFCReader();

  const handleStart = () => {
    startScan((result) => {
      onScanSuccess(result.serialNumber);
    });
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sky-500/10 border-2 border-dashed border-sky-500/40 flex items-center justify-center relative">
        <span className="text-4xl">📱</span>
        {isScanning && (
          <span className="absolute inset-0 rounded-full border-2 border-sky-400 animate-ping opacity-75" />
        )}
      </div>

      <h4 className="text-lg font-bold text-white mb-2">
        {isScanning ? 'Acerca el dispositivo al punto NFC' : 'Lectura de Pasaporte NFC'}
      </h4>
      <p className="text-sm text-slate-400 mb-6">
        {isSupported
          ? 'Toca el sensor NFC ubicado en el mostrador del establecimiento para sellar tu pasaporte.'
          : 'NFC no disponible. Usa el lector QR para registrar tu sello.'}
      </p>

      {error && <p className="text-xs text-rose-400 mb-4">{error}</p>}

      {isSupported && (
        <button
          onClick={isScanning ? stopScan : handleStart}
          className={`w-full py-3 rounded-xl font-bold transition ${
            isScanning ? 'bg-rose-600 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {isScanning ? 'Cancelar Escaneo' : 'Activar Lector NFC'}
        </button>
      )}
    </div>
  );
};
