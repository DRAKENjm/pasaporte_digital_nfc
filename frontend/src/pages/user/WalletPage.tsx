import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { nfcService } from '../../services/nfcService';
import { VisitaHistorial } from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { Button } from '../../components/common/Button';
import { useUI } from '../../hooks/useUI';

export const WalletPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useUI();
  const [historial, setHistorial] = useState<VisitaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
        const data = await nfcService.historial();
        setHistorial(data);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshProfile]);

  const vincularTarjeta = async () => {
    if (!uid.trim()) return;
    try {
      await nfcService.asignarTarjeta(uid.trim());
      showToast('Tarjeta NFC vinculada', 'success');
      setUid('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al vincular', 'error');
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
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Card pasaporte */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
        <p className="text-indigo-200 text-sm mb-1">Tu Pasaporte</p>
        <h1 className="text-2xl font-bold">
          {user?.nombres} {user?.apellidos}
        </h1>
        <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
        <div className="mt-6 flex gap-6">
          <div>
            <div className="text-3xl font-bold">{user?.total_sellos ?? 0}</div>
            <div className="text-indigo-200 text-xs">Sellos</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{user?.puntos_globales ?? 0}</div>
            <div className="text-indigo-200 text-xs">Puntos</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{user?.nivel_nombre || user?.nivel || 'Bronce'}</div>
            <div className="text-indigo-200 text-xs">Nivel</div>
          </div>
        </div>
      </div>

      {/* Vincular NFC */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Vincular tarjeta NFC</h2>
        <p className="text-xs text-slate-400">
          Acerca tu tarjeta o introduce el UID del chip NTAG.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
            placeholder="UID NFC"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
          />
          <Button onClick={vincularTarjeta}>Vincular</Button>
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="font-semibold mb-3">Últimas visitas</h2>
        {historial.length === 0 ? (
          <p className="text-slate-500 text-sm">Aún no tienes sellos. ¡Visita un local aliado!</p>
        ) : (
          <ul className="space-y-2">
            {historial.map((v) => (
              <li
                key={v.id}
                className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-sm">{v.establecimiento_nombre}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(v.fecha_hora).toLocaleString('es-PE')} · {v.metodo_validacion}
                  </div>
                </div>
                <div className="text-emerald-400 font-semibold text-sm">+{v.puntos_ganados} pts</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
