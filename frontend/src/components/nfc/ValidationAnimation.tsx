import React from 'react';

interface ValidationAnimationProps {
  points: number;
  commerceName: string;
  onDone: () => void;
}

export const ValidationAnimation: React.FC<ValidationAnimationProps> = ({ points, commerceName, onDone }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full text-center animate-bounce-short">
        <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl">
          ✓
        </div>
        <h3 className="text-2xl font-black text-white mb-1">¡Sello Validado!</h3>
        <p className="text-slate-400 text-sm mb-4">{commerceName}</p>
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl mb-6">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Has Ganado</span>
          <p className="text-3xl font-black text-emerald-300">+{points} Puntos</p>
        </div>
        <button
          onClick={onDone}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
