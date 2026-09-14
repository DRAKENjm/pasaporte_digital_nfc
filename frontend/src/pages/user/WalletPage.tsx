import React, { useState } from 'react';
import { NFCScanner } from '../../components/nfc/NFCScanner';
import { QRScanner } from '../../components/nfc/QRScanner';
import { ValidationAnimation } from '../../components/nfc/ValidationAnimation';
import { formatPoints, getRankBadgeColor } from '../../utils/formatters';

export const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState(350);
  const [level] = useState('Plata');
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastValidated, setLastValidated] = useState<{ points: number; commerce: string } | null>(null);

  const handleValidation = (tagOrCode: string) => {
    // Simulación de validación exitosa
    const pointsEarned = 50;
    setBalance((prev) => prev + pointsEarned);
    setLastValidated({ points: pointsEarned, commerce: 'Café Central NFC' });
    setShowAnimation(true);
  };

  return (
    <div className="space-y-4">
      {/* Wallet Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-900 via-indigo-950 to-slate-950 border border-sky-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-xs text-sky-300 font-semibold tracking-wider uppercase">Saldo Global</span>
            <h2 className="text-4xl font-black text-white mt-1">{formatPoints(balance)} <span className="text-lg font-bold text-sky-400">PTS</span></h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRankBadgeColor(level)}`}>
            Rango {level}
          </span>
        </div>
        <div className="w-full bg-slate-900/60 rounded-full h-2.5 mb-2 overflow-hidden border border-white/5">
          <div className="bg-gradient-to-r from-sky-500 to-amber-400 h-2.5 rounded-full w-[65%]" />
        </div>
        <p className="text-[11px] text-slate-400 text-right">150 pts para Nivel Oro</p>
      </div>

      {/* NFC & QR Readers */}
      <NFCScanner onScanSuccess={handleValidation} />
      <QRScanner onScanCode={handleValidation} />

      {/* Success Modal */}
      {showAnimation && lastValidated && (
        <ValidationAnimation
          points={lastValidated.points}
          commerceName={lastValidated.commerce}
          onDone={() => setShowAnimation(false)}
        />
      )}
    </div>
  );
};
