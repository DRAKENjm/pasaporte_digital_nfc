import React, { useState } from 'react';
import { nfcService } from '../../services/nfcService';
import { useUI } from '../../hooks/useUI';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const CommerceDashboard: React.FC = () => {
  const [uid, setUid] = useState('');
  const [establecimientoId, setEstablecimientoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { showToast } = useUI();

  const validar = async () => {
    if (!uid || !establecimientoId) {
      showToast('Completa UID y ID de establecimiento', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await nfcService.validarNfc(uid, establecimientoId);
      setLastResult(result);
      showToast('¡Sello acreditado!', 'success');
      setUid('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error en validación', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Panel Comercio</h1>
      <p className="text-sm text-slate-400">
        Valida visitas de clientes acercando su tarjeta NFC o ingresando el UID.
      </p>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <Input
          label="ID del establecimiento"
          value={establecimientoId}
          onChange={(e) => setEstablecimientoId(e.target.value)}
          placeholder="UUID del local"
        />
        <Input
          label="UID de la tarjeta NFC"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Ej: 04:A1:B2:C3:D4:E5:F6"
        />
        <Button onClick={validar} loading={loading} className="w-full">
          Validar visita
        </Button>
      </div>

      {lastResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-sm">
          <p className="font-semibold text-emerald-400">Validación exitosa</p>
          <p className="mt-1">Puntos: +{lastResult.puntos_acreditados}</p>
          <p>
            Cliente: {lastResult.usuario?.nombres} {lastResult.usuario?.apellidos}
          </p>
          <p>
            Total sellos: {lastResult.usuario?.total_sellos} · Puntos:{' '}
            {lastResult.usuario?.puntos_globales}
          </p>
        </div>
      )}
    </div>
  );
};
