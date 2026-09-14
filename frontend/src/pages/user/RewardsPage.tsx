import React from 'react';
import { Reward } from '../../types';
import { formatPoints } from '../../utils/formatters';

export const RewardsPage: React.FC = () => {
  const rewards: Reward[] = [
    {
      id: 'r1',
      title: 'Café de Especialidad Gratis',
      description: 'Válido en cualquier sucursal adherida a la red.',
      pointsCost: 200,
      stock: 15,
      isActive: true,
    },
    {
      id: 'r2',
      title: 'Descuento 30% en Hamburguesas',
      description: 'Aplica a combos seleccionados de lunes a jueves.',
      pointsCost: 400,
      stock: 8,
      isActive: true,
    },
    {
      id: 'r3',
      title: 'Pase VIP Evento Gastronómico',
      description: 'Acceso exclusivo y degustación con chefs locales.',
      pointsCost: 1000,
      stock: 2,
      isActive: true,
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Catálogo de Premios</h2>
        <p className="text-xs text-slate-400">Canjea tus puntos acumulados por experiencias</p>
      </div>

      <div className="grid gap-3">
        {rewards.map((reward) => (
          <div key={reward.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
            <div>
              <h4 className="font-bold text-white text-sm">{reward.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{reward.description}</p>
              <span className="inline-block mt-2 text-xs font-black text-amber-400">
                {formatPoints(reward.pointsCost)} PTS
              </span>
            </div>
            <button className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
              Canjear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
