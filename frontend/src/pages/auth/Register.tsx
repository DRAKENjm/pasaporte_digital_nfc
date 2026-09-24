import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, UserPlus, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";

export const Register: React.FC = () => {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
  });
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
      showToast(
        "Cuenta de cliente creada exitosamente. Inicie sesión para comenzar.",
        "success",
      );
      navigate("/auth/login");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al registrarse", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Registro de Cliente
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Cree su pasaporte digital para acumular sellos y recompensas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nombres *"
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
            required
            placeholder="Ej. Juan"
          />
          <Input
            label="Apellidos *"
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            required
            placeholder="Ej. Pérez"
          />
        </div>

        <Input
          label="Correo Electrónico *"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="ejemplo@correo.com"
        />

        <Input
          label="Contraseña *"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          isPassword
          placeholder="Mínimo 8 caracteres"
        />

        <p className="text-[11px] text-slate-500 leading-tight">
          Al registrarse, declara aceptar los términos del servicio y la política de privacidad de la red aliada.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
        >
          {loading ? (
            "Creando pasaporte..."
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Crear Pasaporte Digital
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ¿Ya tiene una cuenta registrada?{" "}
          <Link
            to="/auth/login"
            className="font-bold text-sky-700 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
