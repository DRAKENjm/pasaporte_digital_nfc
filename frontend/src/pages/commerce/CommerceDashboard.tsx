import React from 'react';

export const CommerceDashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
        <h2 className="text-lg font-bold text-white mb-1">Panel del Comercio</h2>
        <p className="text-xs text-slate-400">Administra tus tags NFC, valida visitas y revisa tus métricas.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <span className="text-2xl font-black text-sky-400">142</span>
          <p className="text-xs text-slate-400 mt-1">Visitas del Mes</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center">
          <span className="text-2xl font-black text-emerald-400">7.100</span>
          <p className="text-xs text-slate-400 mt-1">Puntos Emitidos</p>
        </div>
      </div>
    </div>
  );
};
