import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      navigate('/user/wallet');
    } catch (error: any) {
      setErr(error?.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1">Bienvenido</h2>
      <p className="text-xs text-slate-400 mb-6">Ingresa tus credenciales para acceder a tus puntos</p>

      {err && <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">{err}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="usuario@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" isLoading={isLoading}>
          Ingresar
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 flex flex-col gap-2">
        <Link to="/auth/recover" className="hover:text-slate-300">¿Olvidaste tu contraseña?</Link>
        <p>¿No tienes cuenta? <Link to="/auth/register" className="text-sky-400 hover:underline">Regístrate</Link></p>
      </div>
    </div>
  );
};
