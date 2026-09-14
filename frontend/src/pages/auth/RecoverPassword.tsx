import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const RecoverPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1">Recuperar Acceso</h2>
      <p className="text-xs text-slate-400 mb-6">Ingresa tu correo para recibir instrucciones</p>

      {sent ? (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300">
          Si el correo existe, recibirás un enlace de recuperación.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
          />
          <Button type="submit">Enviar Enlace</Button>
        </form>
      )}

      <div className="mt-6 text-center text-xs">
        <Link to="/auth/login" className="text-sky-400 hover:underline">Volver al inicio de sesión</Link>
      </div>
    </div>
  );
};
