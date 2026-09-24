import QRCode from "qrcode";
import api from "../../services/api";
import React, { useEffect, useMemo, useState } from "react";
import {
  Nfc,
  ShieldCheck,
  QrCode,
  ChevronDown,
  ChevronUp,
  Gift,
} from "lucide-react";
import { User } from "../../types";
import { getNivelInfo, normalizeNivel } from "../../utils/levels";
import { Button } from "../common/Button";
import { useNavigate } from "react-router-dom";

interface Props {
  user?: User | null;
  /** UID de tarjeta NFC vinculada (si existe) */
  uidNfc?: string | null;
  onAcercarLector?: () => void;
}

function formatUid(uid?: string | null, userId?: string) {
  if (uid && uid.length > 4) {
    const clean = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const parts = clean.match(/.{1,4}/g) || [clean];
    return `NFC-${parts.slice(0, 3).join("-")}`;
  }
  if (userId) {
    const short = userId.replace(/-/g, "").slice(0, 12).toUpperCase();
    return `NFC-${short.slice(0, 4)}-${short.slice(4, 8)}-${short.slice(8, 12)}`;
  }
  return "NFC-SIN-VINCULAR";
}

export const DigitalPassportCard: React.FC<Props> = ({
  user,
  uidNfc,
  onAcercarLector,
}) => {
  const navigate = useNavigate();
  const info = getNivelInfo(user);
  const nivel = normalizeNivel(user?.nivel_nombre || user?.nivel);
  const [showQr, setShowQr] = useState(true);
  const [qrUrl, setQrUrl] = useState(""),
    [qrError, setQrError] = useState(""),
    [expires, setExpires] = useState(0),
    [now, setNow] = useState(Date.now());
  const renew = async () => {
    setQrError("");
    try {
      const { data } = await api.get("/nfc/qr");
      setQrUrl(
        await QRCode.toDataURL(data.data.token, { width: 320, margin: 4 }),
      );
      setExpires(data.data.expiresAt);
    } catch {
      setQrError("No se pudo generar el QR. Intenta renovarlo.");
      setQrUrl("");
    }
  };
  useEffect(() => {
    renew();
    const refresh = setInterval(renew, 300000),
      tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [user?.id]);
  const remainingSec = Math.max(0, Math.ceil((expires - now) / 1000)),
    mm = String(Math.floor(remainingSec / 60)).padStart(2, "0"),
    ss = String(remainingSec % 60).padStart(2, "0");

  const displayName =
    [user?.nombres, user?.apellidos].filter(Boolean).join(" ").toUpperCase() ||
    (user?.email || "USUARIO").toUpperCase();

  const badgeLabel =
    nivel === "Diamante"
      ? "DIAMANTE VIP"
      : nivel === "Oro"
        ? "GOLD VIP"
        : nivel === "Plata"
          ? "PLATA"
          : "BRONCE";

  const gradient =
    nivel === "Diamante"
      ? "from-cyan-500 via-sky-600 to-indigo-700"
      : nivel === "Oro"
        ? "from-fuchsia-500 via-violet-600 to-indigo-700"
        : nivel === "Plata"
          ? "from-slate-400 via-slate-500 to-slate-700"
          : "from-amber-700 via-orange-800 to-stone-900";

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Tarjeta tipo pasaporte / bank card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-xl bg-gradient-to-br ${gradient}`}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -left-6 bottom-0 w-28 h-28 rounded-full bg-black/10" />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-300/50 shadow-inner" />
            <Nfc className="w-5 h-5 text-white/80" />
          </div>
          <span className="text-[10px] font-bold tracking-wider bg-white/20 border border-white/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {badgeLabel} · ACTIVO
          </span>
        </div>

        <p className="relative z-10 mt-5 text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">
          NFC ID seguro
        </p>
        <p className="relative z-10 text-lg font-extrabold tracking-wide font-mono mt-0.5">
          {formatUid(uidNfc, user?.id)}
        </p>

        <div className="relative z-10 mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/55">
              Titular oficial
            </p>
            <p className="font-bold text-sm truncate leading-tight mt-0.5">
              {displayName}
            </p>
            <p className="text-[11px] text-white/70 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Pasaporte digital
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold bg-black/25 border border-white/20 px-2.5 py-1.5 rounded-xl">
            PASAPORTE {nivel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* CTA acercar al lector */}
      <Button
        fullWidth
        size="lg"
        className="!rounded-2xl !font-bold"
        onClick={onAcercarLector}
      >
        <Nfc className="w-5 h-5" />
        Acercar al Lector del Local
      </Button>

      {/* QR de contingencia */}
      <div className="card !p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
        >
          <span className="flex items-center gap-2 text-muted">
            <QrCode className="w-4 h-4" />
            {showQr
              ? "Ocultar QR de Contingencia"
              : "Mostrar QR de Contingencia"}
          </span>
          {showQr ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showQr && (
          <div className="px-4 pb-5 flex flex-col items-center gap-2 border-t border-[rgb(var(--app-border))] pt-4">
            <div className="bg-white p-3 rounded-2xl shadow-soft">
              <img
                src={qrUrl || undefined}
                alt="QR de contingencia Pasaporte NFC"
                className="w-44 h-44 object-contain"
                width={176}
                height={176}
              />
            </div>
            {qrError && (
              <p role="alert" className="text-red-500 text-sm">
                {qrError}
              </p>
            )}
            <button onClick={renew} className="text-sm text-sky-500 underline">
              Renovar QR
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mt-1">
              Código de respaldo dinámico
            </p>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium tabular-nums">
              Válido por {mm}:{ss} min
            </p>
          </div>
        )}
      </div>

      {/* Saldo + canjear */}
      <div className="card flex items-center gap-3 !py-3.5">
        <div className="w-11 h-11 rounded-2xl bg-violet-500 flex items-center justify-center text-white shrink-0">
          <Gift className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted font-medium">
            Saldo acumulado
          </p>
          <p className="text-xl font-extrabold tabular-nums leading-tight">
            {info.puntos.toLocaleString("es-PE")}{" "}
            <span className="text-xs font-semibold text-muted">PUNTOS</span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/user/rewards")}
          className="shrink-0"
        >
          Canjear
        </Button>
      </div>
    </div>
  );
};
