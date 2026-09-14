import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
        <h2 className="text-lg font-bold text-white mb-1">SuperAdmin Central</h2>
        <p className="text-xs text-slate-400">Control global de recompensas, comercios y alertas de fraude.</p>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-2">Alertas Antifraude Recientes</h3>
        <p className="text-xs text-slate-500">No hay alertas de visitas duplicadas en la última hora.</p>
      </div>
    </div>
  );
};
