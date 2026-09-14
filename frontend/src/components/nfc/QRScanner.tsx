import React, { useState } from 'react';

interface QRScannerProps {
  onScanCode: (code: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanCode }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onScanCode(code.trim());
      setCode('');
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center mt-4">
      <h4 className="text-sm font-semibold text-slate-300 mb-2">Fallback: Escaneo por Código QR</h4>
      <p className="text-xs text-slate-500 mb-4">Ingresa o escanea el código alternativo del comercio</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Código de sello (Ej. LOCAL-7821)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-sky-500 outline-none"
        />
        <button type="submit" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold text-white">
          Sellar
        </button>
      </form>
    </div>
  );
};
