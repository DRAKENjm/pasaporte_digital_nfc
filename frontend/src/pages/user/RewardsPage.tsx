import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Recompensa } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';

export const RewardsPage: React.FC = () => {
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const { showToast } = useUI();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/rewards');
        setRecompensas(data.data);
      } catch {
        showToast('No se pudo cargar el catálogo', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const canjear = async (id: string) => {
    setCanjeando(id);
    try {
      await api.post('/rewards/canjear', { recompensa_id: id });
      showToast('¡Canje exitoso!', 'success');
      await refreshProfile();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al canjear', 'error');
    } finally {
      setCanjeando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Recompensas</h1>
        <span className="text-sm text-indigo-400 font-medium">{user?.puntos_globales ?? 0} pts</span>
      </div>

      {recompensas.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay recompensas activas por ahora.</p>
      ) : (
        <div className="space-y-3">
          {recompensas.map((r) => (
            <div
              key={r.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center"
            >
              <div className="w-16 h-16 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
                🎁
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{r.nombre_recompensa}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{r.descripcion}</p>
                <p className="text-sm text-indigo-300 mt-1 font-medium">{r.costo_puntos_globales} pts</p>
              </div>
              <Button
                onClick={() => canjear(r.id)}
                loading={canjeando === r.id}
                disabled={(user?.puntos_globales ?? 0) < r.costo_puntos_globales}
                className="shrink-0"
              >
                Canjear
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
