import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import { Input } from "../../components/common/Input";

export const RecoverPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data } = await api.post(
        token ? "/auth/reset-password" : "/auth/recover",
        token ? { token, password } : { email: email.trim() },
      );
      setMessage(data.message || "Instrucciones enviadas a su correo electrónico.");
      setIsSuccess(true);
    } catch (e: any) {
      setMessage(e.response?.data?.message || "No se pudo procesar la solicitud.");
      setIsSuccess(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black tracking-tight text-slate-900">
          {token ? "Establecer Nueva Contraseña" : "Recuperación de Contraseña"}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {token
            ? "Ingrese su nueva clave de acceso para su cuenta"
            : "Le enviaremos un enlace seguro a su correo electrónico"}
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            isSuccess
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{message}</span>
        </div>
      )}

      {(!isSuccess || token) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {token ? (
            <Input
              label="Nueva contraseña *"
              type="password"
              isPassword
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
            />
          ) : (
            <Input
              label="Correo electrónico corporativo / personal *"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
            />
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
          >
            {busy
              ? "Procesando solicitud..."
              : token
              ? "Guardar Nueva Contraseña"
              : "Enviar Enlace de Recuperación"}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-slate-100">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al Inicio de Sesión
        </Link>
      </div>
    </div>
  );
};
