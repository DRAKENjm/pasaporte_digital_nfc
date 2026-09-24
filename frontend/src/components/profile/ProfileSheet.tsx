import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Moon,
  Sun,
  BookOpen,
  LogOut,
  Camera,
  ChevronRight,
  Nfc,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { useUI } from "../../hooks/useUI";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { initials } from "../../utils/levels";
import { DigitalPassportCard } from "./DigitalPassportCard";
import { nfcService } from "../../services/nfcService";
import api from "../../services/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ProfileSheet: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, logout, refreshProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useUI();
  const [editing, setEditing] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uidNfc, setUidNfc] = useState<string | null>(null);
  const [linkUid, setLinkUid] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (user) {
      setNombres(user.nombres || "");
      setApellidos(user.apellidos || "");
      setUsername(user.username || user.apodo || "");
    }
  }, [user, open]);

  // Intentar leer UID vinculado desde historial/perfil si el backend lo expone
  useEffect(() => {
    if (!open) return;
    setUidNfc(null);
    (async () => {
      try {
        const { data } = await api.get("/auth/profile");
        const p = data?.data ?? data;
        const uid = p?.uid_nfc || p?.tarjeta_uid || p?.nfc_uid;
        if (uid) {
          setUidNfc(uid);
        }
      } catch {
        /* opcional */
      }
    })();
  }, [open]);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        username: username.trim() || undefined,
        apodo: username.trim() || undefined,
      });
      await refreshProfile();
      showToast("Perfil actualizado", "success");
      setEditing(false);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "No se pudo guardar el perfil",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const vincular = async () => {
    if (!linkUid.trim()) {
      showToast("Ingresa el UID de la tarjeta", "info");
      return;
    }
    setLinking(true);
    try {
      await nfcService.asignarTarjeta(linkUid.trim());
      setUidNfc(linkUid.trim());

      setLinkUid("");
      showToast("Tarjeta NFC vinculada", "success");
      await refreshProfile();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error al vincular", "error");
    } finally {
      setLinking(false);
    }
  };

  const openReclamaciones = () => {
    window.open(
      "https://www.gob.pe/8231-libro-de-reclamaciones-virtual-del-indecopi",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md h-full bg-[rgb(var(--app-bg))] shadow-2xl animate-slideUp safe-area-pt flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--app-border))] shrink-0">
          <h2 className="font-bold text-lg">Mi pasaporte</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto scroll-touch p-4 space-y-5">
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                showToast("Máximo 5 MB", "error");
                return;
              }
              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  await api.patch("/auth/profile", {
                    avatar_url: reader.result,
                  });
                  await refreshProfile();
                  showToast("Foto actualizada", "success");
                } catch {
                  showToast("No se pudo actualizar la foto", "error");
                }
              };
              reader.readAsDataURL(file);
            }}
          />
          {/* Avatar compacto */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {user?.avatarUrl || user?.avatar_url ? (
                <img
                  src={user.avatarUrl || user.avatar_url}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border-2 border-sky-400"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                  {initials(user)}
                </div>
              )}
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow border-2 border-white dark:border-slate-900"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
                aria-label="Cambiar foto"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {user?.nombres} {user?.apellidos}
              </p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>

          {/* TARJETA DIGITAL + QR + SALDO (como el mockup) */}
          <DigitalPassportCard
            user={user}
            uidNfc={uidNfc}
            onAcercarLector={() =>
              showToast(
                "Acerca tu tarjeta física al lector del local. El comercio confirmará la visita.",
                "info",
              )
            }
          />

          {/* Vincular NFC si no hay UID */}
          {!uidNfc && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <Nfc className="w-4 h-4 text-sky-500" />
                <p className="font-semibold text-sm">Vincular tarjeta física</p>
              </div>
              <Input
                placeholder="UID del chip NTAG"
                value={linkUid}
                onChange={(e) => setLinkUid(e.target.value)}
              />
              <Button fullWidth loading={linking} onClick={vincular}>
                Vincular NFC
              </Button>
            </div>
          )}

          {editing ? (
            <div className="space-y-3 card">
              <Input
                label="Nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
              />
              <Input
                label="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
              <Input
                label="Apodo / usuario (comunidad)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@tu_apodo"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
                <Button fullWidth loading={saving} onClick={save}>
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="card w-full flex items-center gap-3 text-left hover:opacity-90 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Editar datos</p>
                <p className="text-xs text-muted">
                  Nombre, apodo, foto de perfil
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="card w-full flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              {isDark ? (
                <Moon className="w-5 h-5 text-violet-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Apariencia</p>
              <p className="text-xs text-muted">
                {isDark ? "Modo oscuro" : "Modo claro"} (por defecto claro)
              </p>
            </div>
            <span className="text-xs font-semibold text-sky-500">Cambiar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/user/friends");
            }}
            className="card w-full flex items-center gap-3 text-left hover:bg-slate-500/5 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Círculo de amigos</p>
              <p className="text-xs text-muted">Gestionar conexiones y solicitudes</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/user/reclamaciones");
            }}
            className="card w-full flex items-center gap-3 text-left hover:bg-slate-500/5 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Libro de reclamaciones</p>
              <p className="text-xs text-muted">Canal oficial de atención al consumidor</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              onClose();
              logout();
            }}
            className="!mt-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </div>
  );
};
