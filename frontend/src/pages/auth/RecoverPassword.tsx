import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useUI } from '../../hooks/useUI';

export const RecoverPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { showToast } = useUI();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // MVP: solo feedback visual. En producción se enviaría email.
    setSent(true);
    showToast('Si el correo existe, recibirás instrucciones', 'info');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center mb-2">Recuperar contraseña</h2>
      {sent ? (
        <p className="text-slate-300 text-sm text-center">
          Revisa tu bandeja de entrada. Si no llega, verifica el correo o contacta soporte.
        </p>
      ) : (
        <>
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Enviar enlace
          </Button>
        </>
      )}
      <p className="text-center text-sm text-slate-400">
        <Link to="/auth/login" className="text-indigo-400 hover:underline">
          Volver al login
        </Link>
      </p>
    </form>
  );
};
