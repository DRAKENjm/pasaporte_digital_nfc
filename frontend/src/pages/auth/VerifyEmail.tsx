import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";
import { Button } from "../../components/common/Button";
export const VerifyEmail = () => {
  const [params] = useSearchParams();
  const [message, setMessage] = useState(
      "Confirma tu correo para activar el acceso.",
    ),
    [busy, setBusy] = useState(false);
  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold">Verificar correo</h2>
      <p role="status">{message}</p>
      <Button
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api.post("/auth/verify-email", {
              token: params.get("token"),
            });
            setMessage("Correo verificado. Ya puedes iniciar sesión.");
          } catch (e: any) {
            setMessage(
              e.response?.data?.message || "No se pudo verificar el correo",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Verificar mi cuenta
      </Button>
      <Link className="block text-sky-400" to="/auth/login">
        Ir al login
      </Link>
    </div>
  );
};
