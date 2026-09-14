import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [err, setErr] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await register(fullName, email, password, role);
      navigate('/user/wallet');
    } catch (error: any) {
      setErr(error?.response?.data?.message || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-1">Crea tu Pasaporte</h2>
      <p className="text-xs text-slate-400 mb-6">Regístrate para acumular sellos y canjear premios</p>

      {err && <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">{err}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre Completo"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="juan@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1 text-left">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo de Cuenta</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
          >
            <option value="USER">Cliente (Coleccionar Sellos)</option>
            <option value="COMMERCE">Comercio (Validar Visitas)</option>
          </select>
        </div>
        <Button type="submit" isLoading={isLoading}>
          Crear Pasaporte
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        ¿Ya tienes cuenta? <Link to="/auth/login" className="text-sky-400 hover:underline">Inicia sesión</Link>
      </div>
    </div>
  );
};
