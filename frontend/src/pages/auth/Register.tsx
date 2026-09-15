import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const Register: React.FC = () => {
  const [form, setForm] = useState({ nombres: '', apellidos: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      showToast('Cuenta creada correctamente', 'success');
      navigate('/user/wallet');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al registrarse', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center mb-2">Crear cuenta</h2>
      <Input label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} required />
      <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} required />
      <Input label="Correo" type="email" name="email" value={form.email} onChange={handleChange} required />
      <Input
        label="Contraseña"
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        required
        minLength={6}
      />
      <Button type="submit" className="w-full" loading={loading}>
        Registrarme
      </Button>
      <p className="text-center text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/auth/login" className="text-indigo-400 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
};
